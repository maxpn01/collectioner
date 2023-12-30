import { Err, None, Ok, Result } from "ts-results";
import { UserRepository } from ".";
import { Failure } from "../utils/failure";
import { CheckIsAdminUseCase } from "./admin";
import { NotAuthorizedFailure } from "./view-user";

class DeleteUserUseCase {
	userRepository: UserRepository;
	checkIsAdminUseCase: CheckIsAdminUseCase;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
		this.checkIsAdminUseCase = new CheckIsAdminUseCase(userRepository);
	}

	async execute(
		id: string,
		requesterId: string,
		checkRequesterIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		const isAdmin = this.checkIsAdminUseCase.execute(
			requesterId,
			checkRequesterIsAuthenticated,
		);
		if (!isAdmin) return Err(new NotAuthorizedFailure());

		const deleteResult = await this.userRepository.delete(id);
		if (deleteResult.err) return deleteResult;

		return Ok(None);
	}
}
