import { None, Ok, Result } from "ts-results";
import { Failure } from "../utils/failure";
import { AuthorizeCollectionUpdateUseCase } from "./update-collection";
import { UserRepository } from "../user";
import { CollectionRepository } from ".";

class DeleteCollectionUseCase {
	collectionRepository: CollectionRepository;
	userRepository: UserRepository;
	authorizeCollectionUpdate: AuthorizeCollectionUpdateUseCase;

	constructor(
		collectionRepository: CollectionRepository,
		userRepository: UserRepository,
	) {
		this.collectionRepository = collectionRepository;
		this.userRepository = userRepository;
		this.authorizeCollectionUpdate = new AuthorizeCollectionUpdateUseCase(
			collectionRepository,
			userRepository,
		);
	}

	async execute(
		id: string,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const authorizeResult = await this.authorizeCollectionUpdate.execute(
			id,
			requesterId,
		);
		if (authorizeResult.err) return authorizeResult;

		const deleteResult = await this.collectionRepository.delete(id);
		if (deleteResult.err) return deleteResult;

		return Ok(None);
	}
}
