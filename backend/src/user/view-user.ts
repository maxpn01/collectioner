import { Result, Option, Ok, Err } from "ts-results";
import { SizedCollection, UserRepository } from ".";
import {
	BadRequestFailure,
	Failure,
	NotAuthorizedFailure,
	NotFoundFailure,
} from "../utils/failure";

type ViewUserResponse =
	| {
			blocked: false;
			id: string;
			username: string;
			fullname: string;
			collections: ViewUserResponseCollection[];
	  }
	| {
			blocked: true;
	  };

type ViewUserResponseCollection = {
	id: string;
	name: string;
	topic: {
		id: string;
		name: string;
	};
	imageOption: Option<string>;
	size: number;
};

export class ViewUserUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(username: string): Promise<Result<ViewUserResponse, Failure>> {
		const userResult = await this.userRepository.getByUsername(username, {
			include: { collections: true },
		});
		if (userResult.err) return userResult;
		const { user, collections } = userResult.val;

		if (user.blocked) return Ok({ blocked: true });

		return Ok({
			blocked: false,
			id: user.id,
			username: user.username,
			fullname: user.fullname,
			collections: collections.map(this.toResponseCollection),
		});
	}

	private toResponseCollection({
		collection: c,
		size,
	}: SizedCollection): ViewUserResponseCollection {
		return {
			id: c.id,
			name: c.name,
			topic: {
				id: c.topic.id,
				name: c.topic.name,
			},
			imageOption: c.imageOption,
			size,
		};
	}
}

import { httpFailurePresenter, expressSendHttpFailure } from "../http";

export function queryViewUserController(
	username: any,
): Result<string, BadRequestFailure> {
	if (typeof username !== "string") return Err(new BadRequestFailure());

	username = username.trim();
	if (username.length === 0) return Err(new BadRequestFailure());

	return Ok(username);
}

export function viewUserHttpBodyPresenter(response: ViewUserResponse): any {
	if (response.blocked) return { blocked: true };

	return {
		id: response.id,
		username: response.username,
		fullname: response.fullname,
		collections: response.collections,
	};
}

import { Request, Response } from "express";

export class ExpressViewUser {
	viewUser: ViewUserUseCase;

	constructor(viewUser: ViewUserUseCase) {
		this.execute = this.execute.bind(this);
		this.viewUser = viewUser;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const controllerResult = queryViewUserController(req.query.username);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const username = controllerResult.val;

		const viewUserResult = await this.viewUser.execute(username);
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
	page: {
		id: string;
		username: string;
		email: string;
		fullname: string;
		blocked: boolean;
		isAdmin: boolean;
	}[];
	lastPage: number;
};

export class AdminViewUsersUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		request: AdminViewUsersRequest,
		requesterId: string,
	): Promise<Result<AdminViewUsersResponse, Failure>> {
		const allowedSize = request.size > 5 && request.size < 100;
		if (!allowedSize) return Err(new BadRequestFailure());

		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) return requesterResult;
		const { user: requester } = requesterResult.val;

		if (!requester.isAdmin) return Err(new NotAuthorizedFailure());

		const usersResult = await this.userRepository.getPage(
			request.size,
			request.pageN,
		);
		if (usersResult.err) return usersResult;
		const { page, lastPage } = usersResult.val;

		if (request.pageN > lastPage) return Err(new NotFoundFailure());

		const result: AdminViewUsersResponse = {
			page: page.map((user) => ({
				id: user.id,
				username: user.username,
				email: user.email,
				fullname: user.fullname,
				blocked: user.blocked,
				isAdmin: user.isAdmin,
			})),
			lastPage,
		};

		return Ok(result);
	}
}

export function jsonAdminViewUsersController(
	json: any,
): Result<AdminViewUsersRequest, BadRequestFailure> {
	const isValid =
		typeof json.size === "number" &&
		typeof json.pageN === "number" &&
		json.pageN > 0;
	if (!isValid) return Err(new BadRequestFailure());

	return Ok({
		size: json.size,
		pageN: json.pageN,
	});
}

export function adminViewUsersJsonPresenter(response: AdminViewUsersResponse) {
	return response;
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
