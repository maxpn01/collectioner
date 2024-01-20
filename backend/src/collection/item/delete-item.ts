import { Result, None, Ok } from "ts-results";
import { ItemRepository } from ".";
import { UserRepository } from "../../user";
import { Failure } from "../../utils/failure";
import { AuthorizeCollectionUpdate } from "../update-collection";
import { CollectionRepository } from "../repositories/collection";
import { ItemSearchEngine } from "./search-engine";

export class DeleteItemUseCase {
	userRepository: UserRepository;
	itemRepository: ItemRepository;
	itemSearchEngine: ItemSearchEngine;
	authorizeCollectionUpdate: AuthorizeCollectionUpdate;

	constructor(
		userRepository: UserRepository,
		itemRepository: ItemRepository,
		itemSearchEngine: ItemSearchEngine,
		collectionRepository: CollectionRepository,
	) {
		this.userRepository = userRepository;
		this.itemRepository = itemRepository;
		this.itemSearchEngine = itemSearchEngine;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdate(
			collectionRepository,
			userRepository,
		);
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

		const deleteDocumentResult = await this.itemSearchEngine.delete(item.id);
		if (deleteDocumentResult.err) return deleteDocumentResult;

		return Ok(None);
	}
}
