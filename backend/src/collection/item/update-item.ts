import { Result, None, Ok, Err } from "ts-results";
import { ItemField, ItemFields, ItemRepository } from ".";
import { UserRepository } from "../../user";
import { BadRequestFailure, Failure } from "../../utils/failure";
import { AuthorizeCollectionUpdate } from "../update-collection";
import { CollectionFieldRepository } from "../repositories/collection-field";
import { CollectionRepository } from "../repositories/collection";
import { ItemSearchEngine } from "./search-engine";

type UpdateItemRequest = {
	id: string;
	name: string;
	tags: Set<string>;
	numberFields: Map<CollectionFieldId, number>;
	textFields: Map<CollectionFieldId, string>;
	multilineTextFields: Map<CollectionFieldId, string>;
	checkboxFields: Map<CollectionFieldId, boolean>;
	dateFields: Map<CollectionFieldId, Date>;
};

type CollectionFieldId = string;

export class UpdateItemUseCase {
	userRepository: UserRepository;
	itemRepository: ItemRepository;
	itemSearchEngine: ItemSearchEngine;
	authorizeCollectionUpdate: AuthorizeCollectionUpdate;
	collectionFieldRepository: CollectionFieldRepository;

	constructor(
		userRepository: UserRepository,
		itemRepository: ItemRepository,
		itemSearchEngine: ItemSearchEngine,
		collectionRepository: CollectionRepository,
		collectionFieldRepository: CollectionFieldRepository,
	) {
		this.userRepository = userRepository;
		this.itemRepository = itemRepository;
		this.itemSearchEngine = itemSearchEngine;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdate(
			collectionRepository,
			userRepository,
		);
		this.collectionFieldRepository = collectionFieldRepository;
	}

	async execute(
		request: UpdateItemRequest,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const itemResult = await this.itemRepository.get(request.id);
		if (itemResult.err) return itemResult;
		const { item } = itemResult.val;
		const collection = item.collection;

		const authorizeResult = await this.authorizeCollectionUpdate.execute(
			collection,
			requesterId,
		);
		if (authorizeResult.err) return authorizeResult;

		const collectionFieldsResult =
			await this.collectionFieldRepository.getByCollection(collection.id);
		if (collectionFieldsResult.err) throw Error();
		const collectionFields = collectionFieldsResult.val;

		const updatedItem = structuredClone(item);
		updatedItem.name = request.name;
		updatedItem.tags = request.tags;

		const numberFields: ItemField<number>[] = [];
		for (const [collectionFieldId, value] of request.numberFields) {
			numberFields.push({
				item: updatedItem,
				value,
				collectionField: collectionFields.find(
					(f) => f.id === collectionFieldId,
				)!,
			});
		}

		const textFields: ItemField<string>[] = [];
		for (const [collectionFieldId, value] of request.textFields) {
			textFields.push({
				item: updatedItem,
				value,
				collectionField: collectionFields.find(
					(f) => f.id === collectionFieldId,
				)!,
			});
		}

		const multilineTextFields: ItemField<string>[] = [];
		for (const [collectionFieldId, value] of request.multilineTextFields) {
			multilineTextFields.push({
				item: updatedItem,
				value,
				collectionField: collectionFields.find(
					(f) => f.id === collectionFieldId,
				)!,
			});
		}

		const checkboxFields: ItemField<boolean>[] = [];
		for (const [collectionFieldId, value] of request.checkboxFields) {
			checkboxFields.push({
				item: updatedItem,
				value,
				collectionField: collectionFields.find(
					(f) => f.id === collectionFieldId,
				)!,
			});
		}

		const dateFields: ItemField<Date>[] = [];
		for (const [collectionFieldId, value] of request.dateFields) {
			dateFields.push({
				item: updatedItem,
				value,
				collectionField: collectionFields.find(
					(f) => f.id === collectionFieldId,
				)!,
			});
		}

		const fields: ItemFields = {
			numberFields,
			textFields,
			multilineTextFields,
			checkboxFields,
			dateFields,
		};

		const updateResult = await this.itemRepository.update(updatedItem, fields);
		if (updateResult.err) return updateResult;

		const replaceResult = await this.itemSearchEngine.replace(item, fields);
		if (replaceResult.err) return replaceResult;

		return Ok(None);
	}
}

export function jsonUpdateItemController(
	json: any,
): Result<UpdateItemRequest, BadRequestFailure> {
	const isValid =
		typeof json.id === "string" &&
		typeof json.name === "string" &&
		Array.isArray(json.tags) &&
		json.tags.every((tag) => typeof tag === "string") &&
		isValidFields(json.numberFields, (value) => typeof value === "number") &&
		isValidFields(json.textFields, (value) => typeof value === "string") &&
		isValidFields(
			json.multilineTextFields,
			(value) => typeof value === "string",
		) &&
		isValidFields(json.checkboxFields, (value) => typeof value === "boolean") &&
		isValidFields(json.dateFields, (value) => typeof value === "string");
	if (!isValid) return Err(new BadRequestFailure());

	return Ok({
		id: json.id,
		name: json.name,
		tags: json.tags,
		numberFields: new Map(
			json.numberFields?.map(({ collectionFieldId, value }) => [
				collectionFieldId,
				value,
			]),
		),
		textFields: new Map(
			json.textFields?.map(({ collectionFieldId, value }) => [
				collectionFieldId,
				value,
			]),
		),
		multilineTextFields: new Map(
			json.multilineTextFields?.map(({ collectionFieldId, value }) => [
				collectionFieldId,
				value,
			]),
		),
		checkboxFields: new Map(
			json.checkboxFields?.map(({ collectionFieldId, value }) => [
				collectionFieldId,
				value,
			]),
		),
		dateFields: new Map(
			json.dateFields?.map(({ collectionFieldId, value }) => [
				collectionFieldId,
				value,
			]),
		),
	});
}

import { Request, Response } from "express";
import { isValidFields } from "./create-item";
import { expressSendHttpFailure, httpFailurePresenter } from "../../http";

export class ExpressUpdateItem {
	updateItem: UpdateItemUseCase;

	constructor(updateItem: UpdateItemUseCase) {
		this.execute = this.execute.bind(this);
		this.updateItem = updateItem;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const json = req.body;

		const controllerResult = jsonUpdateItemController(json);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const request = controllerResult.val;

		console.log(request);

		//@ts-ignore
		const requesterId = req.session.userId;
		const updateResult = await this.updateItem.execute(request, requesterId);
		if (updateResult.err) {
			const failure = updateResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}

		res.status(200).send();
	}
}
