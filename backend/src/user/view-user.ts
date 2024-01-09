import { Result, Err, Option, Ok } from "ts-results";
import { UserRepository } from ".";
import { Failure } from "../utils/failure";
import { Collection, CollectionRepository } from "../collection";

type ViewUserResponse = {
	id: string;
	username: string;
	fullname: string;
	blocked: boolean;
	collections: ViewUserResponseCollection[];
};

type ViewUserResponseCollection = {
	id: string;
	name: string;
	topic: {
		id: string;
		name: string;
	};
	imageOption: Option<string>;
};

class ViewUserUseCase {
	userRepository: UserRepository;
	collectionRepository: CollectionRepository;

	constructor(
		userRepository: UserRepository,
		collectionRepository: CollectionRepository,
	) {
		this.userRepository = userRepository;
		this.collectionRepository = collectionRepository;
	}

	async execute(id: string): Promise<Result<ViewUserResponse, Failure>> {
		const userResult = await this.userRepository.get(id, {
			include: { collections: true },
		});
		if (userResult.err) return userResult;
		const { user, collections } = userResult.val;

		return Ok({
			id: user.id,
			username: user.username,
			fullname: user.fullname,
			blocked: user.blocked,
			collections: collections.map(this.toResponseCollection),
		});
	}

	private toResponseCollection(c: Collection): ViewUserResponseCollection {
		return {
			id: c.id,
			name: c.name,
			topic: {
				id: c.topic.id,
				name: c.topic.name,
			},
			imageOption: c.imageOption,
		};
	}
}

type AdminViewUserResult = {
	id: string;
	username: string;
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
	): Promise<Result<AdminViewUserResult, Failure>> {
		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) return requesterResult;
		const { user: requester } = requesterResult.val;

		if (!requester.isAdmin) return Err(new NotAuthorizedFailure());
		if (id === requesterId) {
			return Ok(requester);
		}

		const userResult = await this.userRepository.get(id);
		return userResult.map(({ user }) => user);
	}
}
