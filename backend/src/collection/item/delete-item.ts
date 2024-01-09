import { Result, None, Ok } from "ts-results";
import { ItemRepository, ItemFieldRepositories, Item } from ".";
import {
	CollectionField,
	CollectionFieldRepository,
	CollectionRepository,
} from "..";
import { UserRepository } from "../../user";
import { Failure } from "../../utils/failure";
import { AuthorizeCollectionUpdate } from "../update-collection";
import { CommentRepository } from "./comments";

export class DeleteItemUseCase {
	userRepository: UserRepository;
	collectionFieldRepository: CollectionFieldRepository;
	itemRepository: ItemRepository;
	authorizeCollectionUpdate: AuthorizeCollectionUpdate;
	itemFieldRepositories: ItemFieldRepositories;
	commentRepository: CommentRepository;

	constructor(
		userRepository: UserRepository,
		collectionRepository: CollectionRepository,
		collectionFieldRepository: CollectionFieldRepository,
		itemRepository: ItemRepository,
		itemFieldRepositories: ItemFieldRepositories,
		commentRepository: CommentRepository,
	) {
		this.userRepository = userRepository;
		this.collectionFieldRepository = collectionFieldRepository;
		this.itemRepository = itemRepository;
		this.itemFieldRepositories = itemFieldRepositories;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdate(
			collectionRepository,
			userRepository,
		);
		this.commentRepository = commentRepository;
	}

	async execute(
		id: string,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const itemResult = await this.itemRepository.get(id);
		if (itemResult.err) return itemResult;
		const item = itemResult.val;
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

		const deleteItemResult = await this.itemRepository.delete(item.id);
		if (deleteItemResult.err) return deleteItemResult;

		const deleteFields = new DeleteFieldsUseCase(
			item,
			collectionFields,
			this.itemFieldRepositories,
		);
		const deleteFieldsResult = await deleteFields.execute();
		if (deleteFieldsResult.err) return deleteFieldsResult;

		const deleteCommentsResult = await this.commentRepository.deleteByItem(
			item.id,
		);
		if (deleteCommentsResult.err) return deleteCommentsResult;

		return Ok(None);
	}
}

class DeleteFieldsUseCase {
	item: Item;
	collectionFields: CollectionField[];
	itemFieldRepositories: ItemFieldRepositories;

	constructor(
		item: Item,
		collectionFields: CollectionField[],
		itemFieldRepositories: ItemFieldRepositories,
	) {
		this.item = item;
		this.collectionFields = collectionFields;
		this.itemFieldRepositories = itemFieldRepositories;
	}

	async execute(): Promise<Result<None, Failure>> {
		const collectionFieldIds = this.collectionFields.map((f) => f.id);
		const deleteFieldsFns = [
			() =>
				this.itemFieldRepositories.number.deleteByItem(
					this.item.id,
					collectionFieldIds,
				),
			() =>
				this.itemFieldRepositories.text.deleteByItem(
					this.item.id,
					collectionFieldIds,
				),
			() =>
				this.itemFieldRepositories.multilineText.deleteByItem(
					this.item.id,
					collectionFieldIds,
				),
			() =>
				this.itemFieldRepositories.checkbox.deleteByItem(
					this.item.id,
					collectionFieldIds,
				),
			() =>
				this.itemFieldRepositories.date.deleteByItem(
					this.item.id,
					collectionFieldIds,
				),
		];

		for (const setFields of deleteFieldsFns) {
			const result = await setFields();
			if (result.err) return result;
		}

		return Ok(None);
	}
}
