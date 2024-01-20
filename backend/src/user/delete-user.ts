import { Err, None, Ok, Result } from "ts-results";
import { AuthorizeUserUpdateUseCase, UserRepository } from ".";
import { Failure, NotAuthorizedFailure } from "../utils/failure";
import { httpFailurePresenter, expressSendHttpFailure } from "../http";

export class DeleteUserUseCase {
	userRepository: UserRepository;
	authorizeUserUpdate: AuthorizeUserUpdateUseCase;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
		this.authorizeUserUpdate = new AuthorizeUserUpdateUseCase(userRepository);
	}

	async execute(
		id: string,
		requesterId: string,
	): Promise<Result<None, Failure>> {
		const authorized = await this.authorizeUserUpdate.execute(id, requesterId);
		if (!authorized) return Err(new NotAuthorizedFailure());

		const deleteResult = await this.userRepository.delete(id);
		if (deleteResult.err) return deleteResult;

		return Ok(None);
	}
}

import { Request, Response } from "express";
import session from "express-session";
import { idController } from "../utils/id";

export class ExpressDeleteUser {
	deleteUser: DeleteUserUseCase;

	constructor(deleteUser: DeleteUserUseCase) {
		this.execute = this.execute.bind(this);
		this.deleteUser = deleteUser;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const json = req.body;
		//@ts-ignore
		const requesterId = req.session.userId;

		const controllerResult = idController(json.id);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const id = controllerResult.val;

		const setUserBlockedResult = await this.deleteUser.execute(id, requesterId);
		if (setUserBlockedResult.err) {
			const failure = setUserBlockedResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}

		res.status(200).json(req.session);
	}
}
