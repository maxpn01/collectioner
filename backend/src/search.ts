import { Err, Ok, Result } from "ts-results";
import { BadRequestFailure, Failure } from "./utils/failure";
import { ItemRepository } from "./collection/item";
import MeiliSearch from "meilisearch";
import { meiliCollectionIndex } from "./collection/search-engine";
import { ItemDocument, meiliItemIndex } from "./collection/item/search-engine";
import { meiliCommentIndex } from "./collection/item/comments/search-engine";
import { dateToUnixTime, unixTimeToDate } from "./utils/date";

type SearchResponseItem = {
	id: string;
	name: string;
	createdAt: Date;
};

export class SearchUseCase {
	searchEngine: SearchEngine;
	itemRepository: ItemRepository;

	constructor(searchEngine: SearchEngine, itemRepository: ItemRepository) {
		this.searchEngine = searchEngine;
		this.itemRepository = itemRepository;
	}

	async execute(query: string): Promise<Result<SearchResponseItem[], Failure>> {
		const searchResult = await this.searchEngine.search(query);
		if (searchResult.err) return searchResult;
		const matches = searchResult.val;

		const collectionItemsResult =
			await this.itemRepository.getOneFromEachCollection(matches.collectionIds);
		if (collectionItemsResult.err) return collectionItemsResult;
		const collectionItems = collectionItemsResult.val;

		const commentItemsResult = await this.itemRepository.getMany(
			matches.comments.itemIds,
		);
		if (commentItemsResult.err) return commentItemsResult;
		const commentItems = commentItemsResult.val;

		let responseItems: SearchResponseItem[] = [];
		responseItems = responseItems.concat(
			collectionItems,
			matches.items,
			commentItems,
		);

		const responseItemIds = responseItems.map((item) => item.id);
		const uniqueIds = [...new Set(responseItemIds)];

		responseItems = uniqueIds.map(
			(id) => responseItems.find((item) => item.id === id)!,
		);

		return Ok(responseItems);
	}
}

interface SearchEngine {
	search(query: string): Promise<Result<SearchMatches, Failure>>;
}

type SearchMatches = {
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

export class MeiliSearchEngine implements SearchEngine {
	meili: MeiliSearch;

	constructor(meili: MeiliSearch) {
		this.meili = meili;
	}

	async search(query: string): Promise<Result<SearchMatches, Failure>> {
		const response = await this.meili.multiSearch({
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
		console.log(itemsResult);
		const items = itemsResult.hits.map((itemDocument) =>
			itemDocumentToItem(itemDocument as ItemDocument),
		);

		const commentResult = response.results.find(
			(result) => result.indexUid === meiliCommentIndex,
		)!;
		const commentItemIds = new Set(
			commentResult.hits.map((commentDocument) => commentDocument.itemId),
		);

		const searchMatches: SearchMatches = {
			collectionIds,
			items,
			comments: {
				itemIds: commentItemIds,
			},
		};

		return Ok(searchMatches);
	}
}
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

export class QuerySearchController {
	execute(query: string): Result<string, Failure> {
		query = query.trim();
		if (query.length === 0) return Err(new BadRequestFailure());

		return Ok(query);
	}
}

export class JsonSearchResponsePresenter {
	execute(items: SearchResponseItem[]): string {
		const itemObjects = items.map((item) => {
			return {
				id: item.id,
				name: item.name,
				createdAt: dateToUnixTime(item.createdAt),
			};
		});
		const jsonItems = JSON.stringify(itemObjects);

		return jsonItems;
	}
}
