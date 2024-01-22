import { Result, Option, Ok, Err } from "ts-results";
import { UserRepository } from ".";
import {
	BadRequestFailure,
	Failure,
	NotAuthorizedFailure,
} from "../utils/failure";
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
		this.execute = this.execute.bind(this);
		this.viewUser = viewUser;
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

type AdminViewUsersRequest = {
	size: number;
	pageN: number;
};

type AdminViewUsersResponse = {
	id: string;
	username: string;
	email: string;
	fullname: string;
	blocked: boolean;
	isAdmin: boolean;
}[];

export class AdminViewUsersUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		request: AdminViewUsersRequest,
		requesterId: string,
	): Promise<Result<AdminViewUsersResponse, Failure>> {
		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) return requesterResult;
		const { user: requester } = requesterResult.val;

		if (!requester.isAdmin) return Err(new NotAuthorizedFailure());
		if (request.size < 1 || request.pageN < 1)
			return Err(new BadRequestFailure());

		const usersResult = await this.userRepository.getPage(
			request.size,
			request.pageN,
		);
		if (usersResult.err) return usersResult;

		const result: AdminViewUsersResponse = usersResult.val.map((user) => ({
			id: user.id,
			username: user.username,
			email: user.email,
			fullname: user.fullname,
			blocked: user.blocked,
			isAdmin: user.isAdmin,
		}));

		return Ok(result);
	}
}

export function jsonAdminViewUsersController(
	json: any,
): Result<AdminViewUsersRequest, BadRequestFailure> {
	const isValid =
		typeof json.size === "number" && typeof json.pageN === "number";
	if (!isValid) return Err(new BadRequestFailure());

	return Ok({
		size: json.size,
		pageN: json.pageN,
	});
}

export function adminViewUsersJsonPresenter(response: AdminViewUsersResponse) {
	return {
		users: response,
	};
}

export class ExpressAdminViewUsers {
	adminViewUsers: AdminViewUsersUseCase;

	constructor(adminViewUsers: AdminViewUsersUseCase) {
		this.execute = this.execute.bind(this);
		this.adminViewUsers = adminViewUsers;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const controllerResult = jsonAdminViewUsersController(req.body);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const request = controllerResult.val;

		//@ts-ignore
		const requesterId = req.session.userId;

		const adminViewUsersResult = await this.adminViewUsers.execute(
			request,
			requesterId,
		);
		if (adminViewUsersResult.err) {
			const failure = adminViewUsersResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const users = adminViewUsersResult.val;

		const response = adminViewUsersJsonPresenter(users);

		res.status(200).json(response);
	}
}
