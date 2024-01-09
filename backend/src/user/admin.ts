import { Err, None, Ok, Result } from "ts-results";
import { UserRepository } from ".";
import { Failure } from "../utils/failure";
import { NotAuthorizedFailure } from "./view-user";

class SetUserIsAdminUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		id: string,
		isAdmin: boolean,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) throw new Error();
		const { user: requester } = requesterResult.val;

		if (!requester.isAdmin) return Err(new NotAuthorizedFailure());
		const userResult = await this.userRepository.get(id);
		if (userResult.err) return userResult;
		const { user } = userResult.val;

		user.isAdmin = isAdmin;

		const updateResult = await this.userRepository.update(id, user);
		if (updateResult.err) return updateResult;

		return Ok(None);
	}
}

class SetUserBlockedUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		id: string,
		blocked: boolean,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) throw new Error();
		const { user: requester } = requesterResult.val;

		if (!requester.isAdmin) return Err(new NotAuthorizedFailure());

		const userResult = await this.userRepository.get(id);
		if (userResult.err) return userResult;
		const { user } = userResult.val;

		user.blocked = blocked;

		const updateResult = await this.userRepository.update(id, user);
		if (updateResult.err) return updateResult;

		return Ok(None);
	}
}
