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

type SignInWithEmailResponse = {
	id: string;
	isAdmin: boolean;
};

export class SignInWithEmailUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		request: SignInWithEmailRequest,
	): Promise<Result<SignInWithEmailResponse, Failure>> {
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

		return Ok({
			id: user.id,
			isAdmin: user.isAdmin,
		});
	}
}

function jsonSignInWithEmailResponsePresenter(
	response: SignInWithEmailResponse,
): any {
	return {
		userId: response.id,
		isAdmin: response.isAdmin,
	};
}

import {
	HttpFailure,
	httpFailurePresenter,
	expressSendHttpFailure,
} from "../http";

export function jsonSignInWithEmailController(
	json: any,
): Result<SignInWithEmailRequest, BadRequestFailure> {
	const isValidJson =
		typeof json.email === "string" && typeof json.password === "string";
	if (!isValidJson) return Err(new BadRequestFailure());

	return Ok({
		email: json.email,
		password: json.password,
	});
}

export function signInHttpFailurePresenter(failure: Failure): HttpFailure {
	if (failure instanceof InvalidCredentialsFailure) {
		return new HttpFailure(401);
	}

	return httpFailurePresenter(failure);
}

import { Request, Response } from "express";
import "express-session";

export class ExpressSignInWithEmail {
	signInWithEmail: SignInWithEmailUseCase;

	constructor(signInWithEmail: SignInWithEmailUseCase) {
		this.execute = this.execute.bind(this);
		this.signInWithEmail = signInWithEmail;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const json = req.body;

		const controllerResult = jsonSignInWithEmailController(json);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const request = controllerResult.val;

		const signInResult = await this.signInWithEmail.execute(request);
		if (signInResult.err) {
			const failure = signInResult.val;
			const httpFailure = signInHttpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const response = signInResult.val;

		req.session.regenerate(() => {
			//@ts-ignore
			req.session.userId = response.id;
			const json = jsonSignInWithEmailResponsePresenter(response);
			res.status(200).json(json);
		});
	}
}
