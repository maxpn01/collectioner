import { Result, None, Ok } from "ts-results";
import { ItemField, ItemFields, ItemRepository } from ".";
import { CollectionFieldRepository, CollectionRepository } from "..";
import { UserRepository } from "../../user";
import { Failure } from "../../utils/failure";
import { AuthorizeCollectionUpdate } from "../update-collection";

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
	collectionFieldRepository: CollectionFieldRepository;
	itemRepository: ItemRepository;
	authorizeCollectionUpdate: AuthorizeCollectionUpdate;

	constructor(
		userRepository: UserRepository,
		collectionFieldRepository: CollectionFieldRepository,
		itemRepository: ItemRepository,
		collectionRepository: CollectionRepository,
	) {
		this.userRepository = userRepository;
		this.collectionFieldRepository = collectionFieldRepository;
		this.itemRepository = itemRepository;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdate(
			collectionRepository,
			userRepository,
		);
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

		const updateItemResult = await this.itemRepository.update(
			updatedItem,
			fields,
		);
		if (updateItemResult.err) return updateItemResult;

		return Ok(None);
	}
}
