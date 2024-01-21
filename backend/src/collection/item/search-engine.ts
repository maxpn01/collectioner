import { Result, None, Ok, Err } from "ts-results";
import { Failure, BadRequestFailure } from "../../utils/failure";
import { MeiliSearch, TaskStatus } from "meilisearch";
import { Item, ItemField, ItemFields } from ".";
import {
	UnixTime,
	dateToUnixTime,
	safeDateConversion,
	unixTimeToDate,
} from "../../utils/date";
import { ItemRepository } from ".";
import { meiliCollectionIndex } from "../search-engine";
import { meiliCommentIndex } from "./comment/search-engine";
import { httpFailurePresenter, expressSendHttpFailure } from "../../http";

type SearchItemsResponseItem = {
	id: string;
	name: string;
	createdAt: Date;
};

export class SearchItemsUseCase {
	saerchEngine: ItemSearchEngine;
	itemRepository: ItemRepository;

	constructor(saerchEngine: ItemSearchEngine, itemRepository: ItemRepository) {
		this.saerchEngine = saerchEngine;
		this.itemRepository = itemRepository;
	}

	async execute(
		query: string,
	): Promise<Result<SearchItemsResponseItem[], Failure>> {
		const searchResult = await this.saerchEngine.search(query);
		if (searchResult.err) return searchResult;
		const searchItemsMatches = searchResult.val;

		let matchedItems: SearchItemsResponseItem[] = searchItemsMatches.items;

		const getItemsFromCollectionsResult =
			await this.itemRepository.getOneFromEachCollection(
				searchItemsMatches.collectionIds,
			);
		if (getItemsFromCollectionsResult.err) return getItemsFromCollectionsResult;
		const itemsFromCollections = getItemsFromCollectionsResult.val;
		matchedItems = matchedItems.concat(itemsFromCollections);

		const getItemsFromCommentsResult = await this.itemRepository.getMany(
			searchItemsMatches.comments.itemIds,
		);
		if (getItemsFromCommentsResult.err) return getItemsFromCommentsResult;
		const itemsFromComments = getItemsFromCommentsResult.val;
		matchedItems = matchedItems.concat(itemsFromComments);

		matchedItems = uniqueBy((item) => item.id, matchedItems);

		return Ok(matchedItems);
	}
}

export interface ItemSearchEngine {
	search(query: string): Promise<Result<SearchEngineItem, Failure>>;
	add(item: Item, fields: ItemFields): Promise<Result<None, Failure>>;
	replace(item: Item, fields: ItemFields): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

type CollectionFieldId = string;
export type ItemDocument = {
	id: string;
	name: string;
	tags: Set<string>;
	createdAt: UnixTime;
	numberFields: Record<CollectionFieldId, number>;
	textFields: Record<CollectionFieldId, string>;
	multilineTextFields: Record<CollectionFieldId, string>;
	checkboxFields: Record<CollectionFieldId, boolean>;
	dateFields: Record<CollectionFieldId, UnixTime>;
};

export const meiliItemIndex = "item";

export class MeiliItemSearchEngine implements ItemSearchEngine {
	meilisearch: MeiliSearch;

	constructor(meilisearch: MeiliSearch) {
		this.meilisearch = meilisearch;
	}

	async search(query: string): Promise<Result<SearchEngineItem, Failure>> {
		const response = await this.meilisearch.multiSearch({
			queries: [
				{
					indexUid: meiliCollectionIndex,
					q: query,
				},
				{
					indexUid: meiliItemIndex,
					q: query,
				},
				{
					indexUid: meiliCommentIndex,
					q: query,
				},
			],
		});

		const collectionResult = response.results.find(
			(result) => result.indexUid === meiliCollectionIndex,
		)!;
		const collectionIds: Set<string> = new Set(
			collectionResult.hits.map((collectionDocument) => collectionDocument.id),
		);

		const itemsResult = response.results.find(
			(result) => result.indexUid === meiliItemIndex,
		)!;
		const items = itemsResult.hits.map((itemDocument) =>
			itemDocumentToItem(itemDocument as ItemDocument),
		);

		const commentResult = response.results.find(
			(result) => result.indexUid === meiliCommentIndex,
		)!;
		const commentItemIds = new Set(
			commentResult.hits.map((commentDocument) => commentDocument.itemId),
		);

		const matchedItems: SearchEngineItem = {
			collectionIds,
			items,
			comments: {
				itemIds: commentItemIds,
			},
		};

		return Ok(matchedItems);
	}

	async add(item: Item, fields: ItemFields): Promise<Result<None, Failure>> {
		const document = itemToDocument(item, fields);
		const task = await this.meilisearch
			.index(meiliItemIndex)
			.addDocuments([document]);

		if (task.status === TaskStatus.TASK_FAILED)
			throw new Error("Failed to add document");

		return Ok(None);
	}

	async replace(
		item: Item,
		fields: ItemFields,
	): Promise<Result<None, Failure>> {
		// Meilisearch's addDocuments method also replaces the existing documents
		// https://www.meilisearch.com/docs/reference/api/documents#add-or-replace-documents
		return this.add(item, fields);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		const task = await this.meilisearch
			.index(meiliItemIndex)
			.deleteDocument(id);

		if (task.status === TaskStatus.TASK_FAILED)
			throw new Error("Failed to delete document");

		return Ok(None);
	}
}

export function itemToDocument(item: Item, fields: ItemFields): ItemDocument {
	const unixTimeDateFields = fields.dateFields.map((itemField) => ({
		...itemField,
		value: dateToUnixTime(safeDateConversion(itemField.value)),
	}));

	return {
		id: item.id,
		name: item.name,
		tags: item.tags,
		createdAt: dateToUnixTime(item.createdAt),
		numberFields: itemFieldToDocumentField(fields.numberFields),
		textFields: itemFieldToDocumentField(fields.textFields),
		multilineTextFields: itemFieldToDocumentField(fields.multilineTextFields),
		checkboxFields: itemFieldToDocumentField(fields.checkboxFields),
		dateFields: itemFieldToDocumentField(unixTimeDateFields),
	};
}

function itemFieldToDocumentField<T>(
	itemFields: ItemField<T>[],
): Record<string, T> {
	const recordField: Record<string, T> = {};

	for (const itemField of itemFields) {
		recordField[itemField.collectionField.id] = itemField.value;
	}

	return recordField;
}

type SearchEngineItem = {
	collectionIds: Set<string>;
	items: {
		id: string;
		name: string;
		createdAt: Date;
	}[];
	comments: {
		itemIds: Set<string>;
	};
};

function itemDocumentToItem(itemDocument: ItemDocument): {
	id: string;
	name: string;
	createdAt: Date;
} {
	const unixTimeCreatedAt = itemDocument.createdAt as number;

	return {
		id: itemDocument.id as string,
		name: itemDocument.name as string,
		createdAt: unixTimeToDate(unixTimeCreatedAt),
	};
}

export function querySearchController(query: any): Result<string, Failure> {
	if (typeof query !== "string") return Err(new BadRequestFailure());

	query = query.trim();
	if (query.length === 0) return Err(new BadRequestFailure());

	return Ok(query);
}

export function httpMatchedItemsPresenter(
	matchedItems: SearchItemsResponseItem[],
) {
	return matchedItems.map((item) => {
		return {
			id: item.id,
			name: item.name,
			createdAt: dateToUnixTime(item.createdAt),
		};
	});
}

import { Request, Response } from "express";
import { uniqueBy } from "../../utils/array";

export class ExpressSearchItems {
	search: SearchItemsUseCase;

	constructor(search: SearchItemsUseCase) {
		this.execute = this.execute.bind(this);
		this.search = search;
	}

	async execute(req: Request, res: Response) {
		const httpQuery = req.query.q;

		const queryResult = querySearchController(httpQuery);
		if (queryResult.err) {
			const failure = queryResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const query = queryResult.val;

		const searchResult = await this.search.execute(query);
		if (searchResult.err) {
			const failure = searchResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const matchedItems = searchResult.val;

		const httpMatchedItems = httpMatchedItemsPresenter(matchedItems);
		res.status(200).json(httpMatchedItems);
	}
}
