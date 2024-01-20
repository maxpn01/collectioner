import { Result, Option, Ok } from "ts-results";
import { UserRepository } from ".";
import { Failure } from "../utils/failure";
import { Collection } from "../collection";

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

export class ViewUserUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
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

import { httpFailurePresenter, expressSendHttpFailure } from "../http";

export function viewUserHttpBodyPresenter(response: ViewUserResponse) {
	return {
		id: response.id,
		username: response.username,
		fullname: response.fullname,
		blocked: response.blocked,
		collections: response.collections,
	};
}

import { Request, Response } from "express";
import { idController } from "../utils/id";

export class ExpressViewUser {
	viewUser: ViewUserUseCase;

	constructor(viewUser: ViewUserUseCase) {
		this.viewUser = viewUser;
		this.execute = this.execute.bind(this);
	}

	async execute(req: Request, res: Response): Promise<void> {
		const controllerResult = idController(req.query.id);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const id = controllerResult.val;

		const viewUserResult = await this.viewUser.execute(id);
		if (viewUserResult.err) {
			const failure = viewUserResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const user = viewUserResult.val;

		const httpUser = viewUserHttpBodyPresenter(user);

		res.status(200).json(httpUser);
	}
}
