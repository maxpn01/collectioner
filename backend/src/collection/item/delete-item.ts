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
		const { item } = itemResult.val;
		const collection = item.collection;

		const authorizeResult = await this.authorizeCollectionUpdate.execute(
			collection,
			requesterId,
		);
		if (authorizeResult.err) return authorizeResult;

		const deleteItemResult = await this.itemRepository.delete(item.id);
		if (deleteItemResult.err) return deleteItemResult;

		return Ok(None);
	}
}
