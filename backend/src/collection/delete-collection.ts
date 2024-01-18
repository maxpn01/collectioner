import { None, Ok, Result } from "ts-results";
import { Failure } from "../utils/failure";
import { AuthorizeCollectionUpdate } from "./update-collection";
import { UserRepository } from "../user";
import { CollectionRepository } from "./repositories/collection";
import { CollectionSearchEngine } from "./search-engine";

export class DeleteCollectionUseCase {
	collectionRepository: CollectionRepository;
	collectionSearchEngine: CollectionSearchEngine;
	userRepository: UserRepository;
	authorizeCollectionUpdate: AuthorizeCollectionUpdate;

	constructor(
		collectionRepository: CollectionRepository,
		collectionSearchEngine: CollectionSearchEngine,
		userRepository: UserRepository,
	) {
		this.collectionRepository = collectionRepository;
		this.collectionSearchEngine = collectionSearchEngine;
		this.userRepository = userRepository;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdate(
			collectionRepository,
			userRepository,
		);
	}

	async execute(
		id: string,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const collectionResult = await this.collectionRepository.get(id);
		if (collectionResult.err) return collectionResult;
		const { collection } = collectionResult.val;

		const authorizeResult = await this.authorizeCollectionUpdate.execute(
			collection,
			requesterId,
		);
		if (authorizeResult.err) return authorizeResult;

		const deleteResult = await this.collectionRepository.delete(id);
		if (deleteResult.err) return deleteResult;

		const deleteDocumentResult = await this.collectionSearchEngine.delete(id);
		if (deleteDocumentResult.err) return deleteDocumentResult;

		return Ok(None);
	}
}
