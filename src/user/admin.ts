import { Err, None, Ok, Result } from "ts-results";
import { UserRepository } from ".";
import { Failure } from "../utils/failure";
import { NotAuthorizedFailure } from "./view-user";

export class CheckIsAdminUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		requesterId: string,
		checkRequesterIsAuthenticated: () => boolean,
	): Promise<boolean> {
		if (!checkRequesterIsAuthenticated()) return false;

		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) throw new Error();

		const requester = requesterResult.val;
		return requester.isAdmin;
	}
}

class SetUserIsAdminUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(id: string, isAdmin: boolean): Promise<Result<None, Failure>> {
		const userResult = await this.userRepository.get(id);
		if (userResult.err) return userResult;
		const user = userResult.val;

		user.isAdmin = isAdmin;

		const updateResult = await this.userRepository.update(id, user);
		if (updateResult.err) return updateResult;

		return Ok(None);
	}
}

class GrantAdminPrivilegesUseCase {
	userRepository: UserRepository;
	checkIsAdminUseCase: CheckIsAdminUseCase;
	setUserIsAdminUseCase: SetUserIsAdminUseCase;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
		this.checkIsAdminUseCase = new CheckIsAdminUseCase(userRepository);
		this.setUserIsAdminUseCase = new SetUserIsAdminUseCase(userRepository);
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

		return this.setUserIsAdminUseCase.execute(id, true);
	}
}

class RevokeAdminPrivilegesUseCase {
	userRepository: UserRepository;
	checkIsAdminUseCase: CheckIsAdminUseCase;
	setUserIsAdminUseCase: SetUserIsAdminUseCase;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
		this.checkIsAdminUseCase = new CheckIsAdminUseCase(userRepository);
		this.setUserIsAdminUseCase = new SetUserIsAdminUseCase(userRepository);
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

		return this.setUserIsAdminUseCase.execute(id, false);
	}
}

class SetUserBlockedUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(id: string, blocked: boolean): Promise<Result<None, Failure>> {
		const userResult = await this.userRepository.get(id);
		if (userResult.err) return userResult;
		const user = userResult.val;

		user.blocked = blocked;

		const updateResult = await this.userRepository.update(id, user);
		if (updateResult.err) return updateResult;

		return Ok(None);
	}
}

class BlockUserUseCase {
	userRepository: UserRepository;
	checkIsAdminUseCase: CheckIsAdminUseCase;
	setUserBlockedUseCase: SetUserBlockedUseCase;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
		this.checkIsAdminUseCase = new CheckIsAdminUseCase(userRepository);
		this.setUserBlockedUseCase = new SetUserBlockedUseCase(userRepository);
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

		return this.setUserBlockedUseCase.execute(id, true);
	}
}

class UnblockUserUseCase {
	userRepository: UserRepository;
	checkIsAdminUseCase: CheckIsAdminUseCase;
	setUserBlockedUseCase: SetUserBlockedUseCase;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
		this.checkIsAdminUseCase = new CheckIsAdminUseCase(userRepository);
		this.setUserBlockedUseCase = new SetUserBlockedUseCase(userRepository);
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

		return this.setUserBlockedUseCase.execute(id, false);
	}
}
