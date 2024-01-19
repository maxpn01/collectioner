import bcrypt from "bcryptjs";
import { BadRequestFailure, Failure, NotFoundFailure } from "../utils/failure";
import { User, UserRepository } from ".";
import { Err, Ok, Result } from "ts-results";

async function checkPasswordMatches(
	raw: string,
	hash: string,
): Promise<boolean> {
	return await bcrypt.compare(raw, hash);
}

class InvalidCredentialsFailure extends Failure {}

type SignInWithEmailRequest = {
	email: string;
	password: string;
};

export class SignInWithEmailUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		request: SignInWithEmailRequest,
	): Promise<Result<User, Failure>> {
		const userResult = await this.userRepository.getByEmail(request.email);
		if (userResult.err) {
			const failure = userResult.val;

			if (failure instanceof NotFoundFailure) {
				return Err(new InvalidCredentialsFailure());
			}

			return userResult;
		}
		const { user } = userResult.val;

		const passwordMatches = await checkPasswordMatches(
			request.password,
			user.passwordHash,
		);
		if (!passwordMatches) return Err(new InvalidCredentialsFailure());

		return Ok(user);
	}
}

import {
	HttpFailure,
	HttpFailurePresenter,
	expressSendHttpFailure,
} from "../http";

export class JsonSignInWithEmailController {
	execute(json: any): Result<SignInWithEmailRequest, BadRequestFailure> {
		const isValidJson =
			typeof json.email === "string" && typeof json.password === "string";
		if (!isValidJson) return Err(new BadRequestFailure());

		return Ok({
			email: json.email,
			password: json.password,
		});
	}
}

export class SignInHttpFailurePresenter {
	execute(failure: Failure): HttpFailure {
		if (failure instanceof InvalidCredentialsFailure) {
			return new HttpFailure(401);
		}

		throw new Error("Not implemented.");
	}
}

import { Request, Response } from "express";
import "express-session";

export class ExpressSignInWithEmail {
	signInWithEmail: SignInWithEmailUseCase;
	jsonSignInWithEmailController: JsonSignInWithEmailController;
	signInHttpFailurePresenter: SignInHttpFailurePresenter;
	httpFailurePresenter: HttpFailurePresenter;

	constructor(
		signInWithEmail: SignInWithEmailUseCase,
		jsonSignInWithEmailController: JsonSignInWithEmailController,
		signInHttpFailurePresenter: SignInHttpFailurePresenter,
		httpFailurePresenter: HttpFailurePresenter,
	) {
		this.signInWithEmail = signInWithEmail;
		this.jsonSignInWithEmailController = jsonSignInWithEmailController;
		this.signInHttpFailurePresenter = signInHttpFailurePresenter;
		this.httpFailurePresenter = httpFailurePresenter;
		this.execute = this.execute.bind(this);
	}

	async execute(req: Request, res: Response): Promise<void> {
		const json = req.body;

		const controllerResult = this.jsonSignInWithEmailController.execute(json);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = this.httpFailurePresenter.execute(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const request = controllerResult.val;

		const signInResult = await this.signInWithEmail.execute(request);
		if (signInResult.err) {
			const failure = signInResult.val;
			const httpFailure = this.signInHttpFailurePresenter.execute(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const user = signInResult.val;

		req.session.regenerate(() => {
			//@ts-ignore
			req.session.userId = user.id;
			res.status(200).json(req.session);
		});
	}
}
