import { Result, Err } from "ts-results";
import { UserRepository } from ".";
import { Failure } from "../utils/failure";

type ViewUserResult = {
	id: string;
	fullname: string;
	blocked: boolean;
};

class ViewUserUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(id: string): Promise<Result<ViewUserResult, Failure>> {
		const userResult = await this.userRepository.get(id);

		return userResult.map((user) => {
			return {
				id: user.id,
				fullname: user.fullname,
				blocked: user.blocked,
			};
		});
	}
}

type AdminViewUserResult = {
	id: string;
	email: string;
	fullname: string;
	blocked: boolean;
	isAdmin: boolean;
};

export class NotAuthorizedFailure extends Failure {}

class AdminViewUserUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		id: string,
		requesterId: string,
		checkRequesterIsAuthenticated: () => boolean,
	): Promise<Result<AdminViewUserResult, Failure>> {
		if (!checkRequesterIsAuthenticated()) {
			return Err(new NotAuthorizedFailure());
		}

		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) return requesterResult;

		const requester = requesterResult.val;
		if (!requester.isAdmin) {
			return Err(new NotAuthorizedFailure());
		}

		return this.userRepository.get(id);
	}
}
