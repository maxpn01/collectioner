import { Result, Ok, Err } from "ts-results";
import {
	Collection,
	CollectionFieldType,
	CollectionField,
	collectionFieldTypes,
} from "..";
import { UserRepository } from "../../user";
import { BadRequestFailure, Failure } from "../../utils/failure";
import { AuthorizeCollectionUpdate } from "../update-collection";
import { nanoid } from "nanoid";
import { Item, ItemRepository, ItemFields, ItemField } from ".";
import { areArraysEqual } from "../../utils/array";
import { CollectionRepository } from "../repositories/collection";
import { ItemSearchEngine } from "./search-engine";

function generateItemId(): string {
	return nanoid();
}

function createNewItem({
	name,
	tags,
	collection,
}: {
	name: string;
	tags: Set<string>;
	collection: Collection;
}): Item {
	return {
		name,
		tags,
		collection,
		id: generateItemId(),
		createdAt: new Date(),
	};
}

type CreateItemRequest = {
	collectionId: string;
	name: string;
	tags: Set<string>;
	numberFields: Map<CollectionFieldId, number>;
	textFields: Map<CollectionFieldId, string>;
	multilineTextFields: Map<CollectionFieldId, string>;
	checkboxFields: Map<CollectionFieldId, boolean>;
	dateFields: Map<CollectionFieldId, Date>;
};

type CollectionFieldId = string;

export class CreateItemUseCase {
	collectionRepository: CollectionRepository;
	itemRepository: ItemRepository;
	itemSearchEngine: ItemSearchEngine;
	authorizeCollectionUpdate: AuthorizeCollectionUpdate;

	constructor(
		collectionRepository: CollectionRepository,
		itemRepository: ItemRepository,
		itemSearchEngine: ItemSearchEngine,
		userRepository: UserRepository,
	) {
		this.collectionRepository = collectionRepository;
		this.itemRepository = itemRepository;
		this.itemSearchEngine = itemSearchEngine;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdate(
			collectionRepository,
			userRepository,
		);
	}

	async execute(
		request: CreateItemRequest,
		requesterId: string,
	): Promise<Result<string, Failure>> {
		const collectionResult = await this.collectionRepository.get(
			request.collectionId,
			{ include: { fields: true } },
		);
		if (collectionResult.err) return collectionResult;
		const { collection, fields: collectionFields } = collectionResult.val;

		const authorizeResult = await this.authorizeCollectionUpdate.execute(
			collection,
			requesterId,
		);
		if (authorizeResult.err) return authorizeResult;

		const checkAllFieldsSpecified = new CheckAllFieldsSpecified(
			request,
			collectionFields,
		);
		const allFieldsSpecified = await checkAllFieldsSpecified.execute();
		if (!allFieldsSpecified) return Err(new BadRequestFailure());

		const item: Item = createNewItem({
			collection,
			name: request.name,
			tags: request.tags,
		});

		const numberFields: ItemField<number>[] = [];
		for (const [collectionFieldId, value] of request.numberFields) {
			numberFields.push({
				item,
				value,
				collectionField: collectionFields.find(
					(f) => f.id === collectionFieldId,
				)!,
			});
		}

		const textFields: ItemField<string>[] = [];
		for (const [collectionFieldId, value] of request.textFields) {
			textFields.push({
				item,
				value,
				collectionField: collectionFields.find(
					(f) => f.id === collectionFieldId,
				)!,
			});
		}

		const multilineTextFields: ItemField<string>[] = [];
		for (const [collectionFieldId, value] of request.multilineTextFields) {
			multilineTextFields.push({
				item,
				value,
				collectionField: collectionFields.find(
					(f) => f.id === collectionFieldId,
				)!,
			});
		}

		const checkboxFields: ItemField<boolean>[] = [];
		for (const [collectionFieldId, value] of request.checkboxFields) {
			checkboxFields.push({
				item,
				value,
				collectionField: collectionFields.find(
					(f) => f.id === collectionFieldId,
				)!,
			});
		}

		const dateFields: ItemField<Date>[] = [];
		for (const [collectionFieldId, value] of request.dateFields) {
			dateFields.push({
				item,
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

		const createItemResult = await this.itemRepository.create(item, fields);
		if (createItemResult.err) return createItemResult;

		const addDocumentResult = await this.itemSearchEngine.add(item, fields);
		if (addDocumentResult.err) return addDocumentResult;

		return Ok(item.id);
	}
}

type RequestFields = {
	numberFields: Map<CollectionFieldId, number>;
	textFields: Map<CollectionFieldId, string>;
	multilineTextFields: Map<CollectionFieldId, string>;
	checkboxFields: Map<CollectionFieldId, boolean>;
	dateFields: Map<CollectionFieldId, Date>;
};

export class CheckAllFieldsSpecified {
	request: RequestFields;
	allCollectionFields: CollectionField[];

	constructor(request: RequestFields, allCollectionFields: CollectionField[]) {
		this.request = request;
		this.allCollectionFields = allCollectionFields;
	}

	async execute(): Promise<boolean> {
		const eachType = collectionFieldTypes.map((type) => {
			return () => this.checkCollectionFieldsSpecified(type);
		});

		for (const checkSpecified of eachType) {
			const specified = checkSpecified();
			if (!specified) return false;
		}

		return true;
	}

	checkCollectionFieldsSpecified(type: CollectionFieldType): boolean {
		const requestFields = this.getRequestFieldsOfType(type);
		const requestFieldIds = [...requestFields.keys()];

		const collectionFields = this.allCollectionFields.filter(
			(f) => f.type === type,
		);
		const collectionFieldIds = collectionFields.map((f) => f.id);

		return areArraysEqual(requestFieldIds, collectionFieldIds);
	}

	getRequestFieldsOfType(type: CollectionFieldType): Map<string, any> {
		const map = {
			[CollectionFieldType.Number]: this.request.numberFields,
			[CollectionFieldType.Text]: this.request.textFields,
			[CollectionFieldType.MultilineText]: this.request.multilineTextFields,
			[CollectionFieldType.Checkbox]: this.request.checkboxFields,
			[CollectionFieldType.Date]: this.request.dateFields,
		};

		return map[type];
	}
}
