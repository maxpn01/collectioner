import { Err, None, Ok, Result } from "ts-results";
import { AuthorizeUserUpdateUseCase, UserRepository } from ".";
import { Failure } from "../utils/failure";
import { CheckIsAdminUseCase } from "./admin";
import { NotAuthorizedFailure } from "./view-user";

class DeleteUserUseCase {
	userRepository: UserRepository;
	authorizeUserUpdateUseCase: AuthorizeUserUpdateUseCase;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
		this.authorizeUserUpdateUseCase = new AuthorizeUserUpdateUseCase(
			userRepository,
		);
	}

	async execute(
		id: string,
		requesterId: string,
		checkRequesterIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		const authorized = await this.authorizeUserUpdateUseCase.execute(
			id,
			requesterId,
			checkRequesterIsAuthenticated,
		);
		if (!authorized) return Err(new NotAuthorizedFailure());

		const deleteResult = await this.userRepository.delete(id);
		if (deleteResult.err) return deleteResult;

		return Ok(None);
	}
}
