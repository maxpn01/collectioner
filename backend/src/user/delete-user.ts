import { Err, None, Ok, Result } from "ts-results";
import { AuthorizeUserUpdateUseCase, UserRepository } from ".";
import { expressSendHttpFailure, httpFailurePresenter } from "../http";
import {
	BadRequestFailure,
	Failure,
	NotAuthorizedFailure,
} from "../utils/failure";

export class UserDeleteManyUseCase {
	userRepository: UserRepository;
	authorizeUserUpdate: AuthorizeUserUpdateUseCase;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
		this.authorizeUserUpdate = new AuthorizeUserUpdateUseCase(userRepository);
	}

	async execute(
		ids: string[],
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) throw new Error();
		const { user: requester } = requesterResult.val;
		if (!requester.isAdmin) return Err(new NotAuthorizedFailure());

		const deleteResult = await this.userRepository.deleteMany(ids);
		if (deleteResult.err) return deleteResult;

		return Ok(None);
	}
}

export function jsonUserDeleteManyController(
	json: any,
): Result<string[], BadRequestFailure> {
	const isValid =
		Array.isArray(json.ids) &&
		json.ids.every((id: any) => typeof id === "string");
	if (!isValid) return Err(new BadRequestFailure());

	return Ok(json.ids);
}

import { Request, Response } from "express";

export class ExpressUserDeleteMany {
	deleteUser: UserDeleteManyUseCase;

	constructor(deleteUser: UserDeleteManyUseCase) {
		this.execute = this.execute.bind(this);
		this.deleteUser = deleteUser;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const json = req.body;
		//@ts-ignore
		const requesterId = req.session.userId;

		const controllerResult = jsonUserDeleteManyController(json);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const userIds = controllerResult.val;

		const deleteResult = await this.deleteUser.execute(userIds, requesterId);
		if (deleteResult.err) {
			const failure = deleteResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}

		res.status(200).send();
	}
}
