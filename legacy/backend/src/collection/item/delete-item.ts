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

		const deleteResult = await this.itemRepository.delete(item.id);
		if (deleteResult.err) return deleteResult;

		const deleteDocumentResult = await this.itemSearchEngine.delete(item.id);
		if (deleteDocumentResult.err) return deleteDocumentResult;

		return Ok(None);
	}
}

import { Request, Response } from "express";
import { idController } from "../../utils/id";
import { expressSendHttpFailure, httpFailurePresenter } from "../../http";

export class ExpressDeleteItem {
	deleteItem: DeleteItemUseCase;

	constructor(deleteItem: DeleteItemUseCase) {
		this.execute = this.execute.bind(this);
		this.deleteItem = deleteItem;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const controllerResult = idController(req.body.id);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const id = controllerResult.val;

		//@ts-ignore
		const requesterId = req.session.userId;

		const deleteResult = await this.deleteItem.execute(id, requesterId);
		if (deleteResult.err) {
			const failure = deleteResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}

		res.status(200).send();
	}
}
