import { Err, None, Ok, Result } from "ts-results";
import { AuthorizeUserUpdateUseCase, UserRepository } from ".";
import { Failure } from "../utils/failure";
import { NotAuthorizedFailure } from "./view-user";

class DeleteUserUseCase {
	userRepository: UserRepository;
	authorizeUserUpdate: AuthorizeUserUpdateUseCase;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
		this.authorizeUserUpdate = new AuthorizeUserUpdateUseCase(userRepository);
	}

	async execute(
		id: string,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const authorized = await this.authorizeUserUpdate.execute(id, requesterId);
		if (!authorized) return Err(new NotAuthorizedFailure());

		const deleteResult = await this.userRepository.delete(id);
		if (deleteResult.err) return deleteResult;

		return Ok(None);
	}
}
