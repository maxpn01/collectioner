import { Err, None, Ok, Result } from "ts-results";
import { UserRepository } from ".";
import {
	BadRequestFailure,
	Failure,
	NotAuthorizedFailure,
} from "../utils/failure";

type UserIsAdminSetManyRequest = {
	ids: string[];
	isAdmin: boolean;
};

export class UserIsAdminSetManyUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		request: UserIsAdminSetManyRequest,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) throw new Error();
		const { user: requester } = requesterResult.val;
		if (!requester.isAdmin) return Err(new NotAuthorizedFailure());

		const getManyResult = await this.userRepository.getMany(request.ids);
		if (getManyResult.err) return getManyResult;
		const users = getManyResult.val.map(({ user }) => user);

		for (const user of users) {
			user.isAdmin = request.isAdmin;
		}

		const updateResult = await this.userRepository.updateMany(users);
		if (updateResult.err) return updateResult;

		return Ok(None);
	}
}

import { httpFailurePresenter, expressSendHttpFailure } from "../http";

export function jsonUserIsAdminSetManyController(
	json: any,
): Result<UserIsAdminSetManyRequest, BadRequestFailure> {
	const isValidJson =
		Array.isArray(json.ids) &&
		json.ids.every((id: any) => typeof id === "string") &&
		typeof json.isAdmin === "boolean";
	if (!isValidJson) return Err(new BadRequestFailure());

	return Ok({
		ids: json.ids,
		isAdmin: json.isAdmin,
	});
}

import { Request, Response } from "express";
import session from "express-session";

export class ExpressUserIsAdminSetMany {
	userIsAdminSetMany: UserIsAdminSetManyUseCase;

	constructor(userIsAdminSetMany: UserIsAdminSetManyUseCase) {
		this.execute = this.execute.bind(this);
		this.userIsAdminSetMany = userIsAdminSetMany;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const json = req.body;
		//@ts-ignore
		const requesterId = req.session.userId;

		const controllerResult = jsonUserIsAdminSetManyController(json);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const request = controllerResult.val;

		const setUserIsAdminResult = await this.userIsAdminSetMany.execute(
			request,
			requesterId,
		);
		if (setUserIsAdminResult.err) {
			const failure = setUserIsAdminResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}

		res.status(200).send();
	}
}

type UserBlockedSetManyRequest = {
	ids: string[];
	blocked: boolean;
};

export class UserBlockedSetManyUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		request: UserBlockedSetManyRequest,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) throw new Error();
		const { user: requester } = requesterResult.val;
		if (!requester.isAdmin) return Err(new NotAuthorizedFailure());

		const getManyResult = await this.userRepository.getMany(request.ids);
		if (getManyResult.err) return getManyResult;
		const users = getManyResult.val.map(({ user }) => user);

		for (const user of users) {
			user.blocked = request.blocked;
		}

		const updateResult = await this.userRepository.updateMany(users);
		if (updateResult.err) return updateResult;

		return Ok(None);
	}
}

export function jsonUserBlockedSetManyController(
	json: any,
): Result<UserBlockedSetManyRequest, BadRequestFailure> {
	const isValid =
		Array.isArray(json.ids) &&
		json.ids.every((id: any) => typeof id === "string") &&
		typeof json.blocked === "boolean";
	if (!isValid) return Err(new BadRequestFailure());

	return Ok({
		ids: json.ids,
		blocked: json.blocked,
	});
}

export class ExpressUserBlockedSetMany {
	setUserBlocked: UserBlockedSetManyUseCase;

	constructor(setUserBlocked: UserBlockedSetManyUseCase) {
		this.execute = this.execute.bind(this);
		this.setUserBlocked = setUserBlocked;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const json = req.body;
		//@ts-ignore
		const requesterId = req.session.userId;

		const controllerResult = jsonUserBlockedSetManyController(json);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const request = controllerResult.val;

		const setUserBlockedResult = await this.setUserBlocked.execute(
			request,
			requesterId,
		);
		if (setUserBlockedResult.err) {
			const failure = setUserBlockedResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}

		res.status(200).send();
	}
}
