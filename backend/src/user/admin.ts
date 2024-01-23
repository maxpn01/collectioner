import { Err, None, Ok, Result } from "ts-results";
import { UserRepository } from ".";
import {
	BadRequestFailure,
	Failure,
	NotAuthorizedFailure,
} from "../utils/failure";

type SetUserIsAdminRequest = {
	id: string;
	isAdmin: boolean;
};

export class SetUserIsAdminUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		request: SetUserIsAdminRequest,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) throw new Error();
		const { user: requester } = requesterResult.val;

		if (!requester.isAdmin) return Err(new NotAuthorizedFailure());
		const userResult = await this.userRepository.get(request.id);
		if (userResult.err) return userResult;
		const { user } = userResult.val;

		user.isAdmin = request.isAdmin;

		const updateResult = await this.userRepository.update(request.id, user);
		if (updateResult.err) return updateResult;

		return Ok(None);
	}
}

import { httpFailurePresenter, expressSendHttpFailure } from "../http";

export function jsonSetUserIsAdminController(
	json: any,
): Result<SetUserIsAdminRequest, BadRequestFailure> {
	const isValidJson =
		typeof json.id === "string" && typeof json.isAdmin === "boolean";
	if (!isValidJson) return Err(new BadRequestFailure());

	return Ok({
		id: json.id,
		isAdmin: json.isAdmin,
	});
}

import { Request, Response } from "express";
import session from "express-session";

export class ExpressSetUserIsAdmin {
	setUserIsAdmin: SetUserIsAdminUseCase;

	constructor(setUserIsAdmin: SetUserIsAdminUseCase) {
		this.execute = this.execute.bind(this);
		this.setUserIsAdmin = setUserIsAdmin;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const json = req.body;
		//@ts-ignore
		const requesterId = req.session.userId;

		const controllerResult = jsonSetUserIsAdminController(json);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const request = controllerResult.val;

		const setUserIsAdminResult = await this.setUserIsAdmin.execute(
			request,
			requesterId,
		);
		if (setUserIsAdminResult.err) {
			const failure = setUserIsAdminResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}

		res.status(200).json(req.session);
	}
}

type SetUserBlockedRequest = {
	id: string;
	blocked: boolean;
};

export class SetUserBlockedUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		request: SetUserBlockedRequest,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) throw new Error();
		const { user: requester } = requesterResult.val;

		if (!requester.isAdmin) return Err(new NotAuthorizedFailure());

		const userResult = await this.userRepository.get(request.id);
		if (userResult.err) return userResult;
		const { user } = userResult.val;

		user.blocked = request.blocked;

		const updateResult = await this.userRepository.update(request.id, user);
		if (updateResult.err) return updateResult;

		return Ok(None);
	}
}

export function jsonSetUserBlockedController(
	json: any,
): Result<SetUserBlockedRequest, BadRequestFailure> {
	const isValid =
		typeof json.id === "string" && typeof json.blocked === "boolean";
	if (!isValid) return Err(new BadRequestFailure());

	return Ok({
		id: json.id,
		blocked: json.blocked,
	});
}

export class ExpressSetUserBlocked {
	setUserBlocked: SetUserBlockedUseCase;

	constructor(setUserBlocked: SetUserBlockedUseCase) {
		this.execute = this.execute.bind(this);
		this.setUserBlocked = setUserBlocked;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const json = req.body;
		//@ts-ignore
		const requesterId = req.session.userId;

		const controllerResult = jsonSetUserBlockedController(json);
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

		res.status(200).json(req.session);
	}
}
