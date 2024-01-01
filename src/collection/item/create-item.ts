import { Result, None, Ok, Err } from "ts-results";
import {
	Collection,
	CollectionRepository,
	CollectionFieldType,
	CollectionField,
	CollectionFieldRepository,
	collectionFieldTypes,
} from "..";
import { UserRepository } from "../../user";
import { BadRequestFailure, Failure } from "../../utils/failure";
import { AuthorizeCollectionUpdateUseCase } from "../update-collection";
import { nanoid } from "nanoid";
import { Item, ItemRepository, ItemField, ItemFieldRepository } from ".";
import { stringify } from "querystring";
import { areArraysEqual } from "../../utils/array";

function generateItemId(): string {
	return nanoid();
}

function generateItemFieldId(): string {
	return nanoid();
}

function createNewItem({
	name,
	tags,
	collection,
}: {
	name: string;
	tags: string[];
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
	tags: string[];
	numberFields: Map<CollectionFieldId, number>;
	textFields: Map<CollectionFieldId, string>;
	multilineTextFields: Map<CollectionFieldId, string>;
	checkboxFields: Map<CollectionFieldId, boolean>;
	dateFields: Map<CollectionFieldId, Date>;
};

type CollectionFieldId = string;

export class CreateItemUseCase {
	userRepository: UserRepository;
	collectionFieldRepository: CollectionFieldRepository;
	itemRepository: ItemRepository;
	numberFieldRepository: ItemFieldRepository<number>;
	textFieldRepository: ItemFieldRepository<string>;
	multilineTextFieldRepository: ItemFieldRepository<string>;
	checkboxFieldRepository: ItemFieldRepository<boolean>;
	dateFieldRepository: ItemFieldRepository<Date>;
	authorizeCollectionUpdate: AuthorizeCollectionUpdateUseCase;

	constructor(
		userRepository: UserRepository,
		collectionRepository: CollectionRepository,
		collectionFieldRepository: CollectionFieldRepository,
		itemRepository: ItemRepository,
		numberFieldRepository: ItemFieldRepository<number>,
		textFieldRepository: ItemFieldRepository<string>,
		multilineTextFieldRepository: ItemFieldRepository<string>,
		checkboxFieldRepository: ItemFieldRepository<boolean>,
		dateFieldRepository: ItemFieldRepository<Date>,
	) {
		this.userRepository = userRepository;
		this.collectionFieldRepository = collectionFieldRepository;
		this.itemRepository = itemRepository;
		this.numberFieldRepository = numberFieldRepository;
		this.textFieldRepository = textFieldRepository;
		this.multilineTextFieldRepository = multilineTextFieldRepository;
		this.checkboxFieldRepository = checkboxFieldRepository;
		this.dateFieldRepository = dateFieldRepository;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdateUseCase(
			collectionRepository,
			userRepository,
		);
	}

	async execute(
		request: CreateItemRequest,
		requesterId: string,
		checkRequesterIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		const collectionResult = await this.authorizeCollectionUpdate.execute(
			request.collectionId,
			requesterId,
			checkRequesterIsAuthenticated,
		);
		if (collectionResult.err) return collectionResult;
		const collection = collectionResult.val;

		const collectionFieldsResult =
			await this.collectionFieldRepository.getByCollection(collection.id);
		if (collectionFieldsResult.err) throw Error();
		const collectionFields = collectionFieldsResult.val;

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

		const createItemResult = await this.itemRepository.create(item);
		if (createItemResult.err) return createItemResult;

		const saveFieldsResult = await this.saveFields(
			request,
			collectionFields,
			item,
		);
		if (saveFieldsResult.err) return saveFieldsResult;

		return Ok(None);
	}

	async saveFields(
		request: CreateItemRequest,
		collectionFields: CollectionField[],
		item: Item,
	): Promise<Result<None, Failure>> {
		const saveFieldsOfType = new SaveFieldsOfType(item, collectionFields);
		const saveFieldsOfTypeFunctions = [
			() =>
				saveFieldsOfType.execute(
					request.numberFields,
					this.numberFieldRepository,
				),
			() =>
				saveFieldsOfType.execute(request.textFields, this.textFieldRepository),
			() =>
				saveFieldsOfType.execute(
					request.multilineTextFields,
					this.multilineTextFieldRepository,
				),
			() =>
				saveFieldsOfType.execute(
					request.checkboxFields,
					this.checkboxFieldRepository,
				),
			() =>
				saveFieldsOfType.execute(request.dateFields, this.dateFieldRepository),
		];

		for (const fn of saveFieldsOfTypeFunctions) {
			const result = await fn();
			if (result.err) return result;
		}

		return Ok(None);
	}
}

class SaveFieldsOfType {
	item: Item;
	collectionFields: CollectionField[];

	constructor(item: Item, collectionFields: CollectionField[]) {
		this.item = item;
		this.collectionFields = collectionFields;
	}

	async execute<T>(
		requestFields: Map<string, T>,
		itemFieldRepository: ItemFieldRepository<T>,
	): Promise<Result<None, Failure>> {
		for (const [collectionFieldId, value] of requestFields) {
			const collectionField = this.collectionFields.find(
				(f) => f.id === collectionFieldId,
			)!;
			const itemField: ItemField<T> = {
				id: generateItemFieldId(),
				item: this.item,
				value,
				collectionField,
			};
			const createResult = await itemFieldRepository.create(itemField);
			if (createResult.err) return createResult;
		}

		return Ok(None);
	}
}

type RequestFields = {
	numberFields: Map<CollectionFieldId, number>;
	textFields: Map<CollectionFieldId, string>;
	multilineTextFields: Map<CollectionFieldId, string>;
	checkboxFields: Map<CollectionFieldId, boolean>;
	dateFields: Map<CollectionFieldId, Date>;
};

class CheckAllFieldsSpecified {
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
		const collectionFields = this.allCollectionFields.filter(
			(f) => f.type === type,
		);
		const collectionFieldIds = collectionFields.map((f) => f.id);

		const requestFields = this.getRequestFieldsOfType(type);
		const requestFieldIds = [...requestFields.keys()];

		return areArraysEqual(collectionFieldIds, requestFieldIds);
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
