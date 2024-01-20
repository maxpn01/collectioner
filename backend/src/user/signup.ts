import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { BadRequestFailure, Failure } from "../utils/failure";
import {
	EmailIsTakenFailure,
	User,
	UserRepository,
	UsernameIsTakenFailure,
} from ".";
import { Err, None, Ok, Result } from "ts-results";
import {
	HttpFailure,
	JsonHttpFailure,
	expressSendHttpFailure,
	httpFailurePresenter,
} from "../http";

function generateUserId(): string {
	return nanoid();
}

class ValidatePasswordFailure extends Failure {
	passwordTooShort: boolean;

	constructor({ passwordTooShort }: { passwordTooShort: boolean }) {
		super();

		const isFailure = passwordTooShort;
		if (!isFailure) throw new Error("This failure is not really a failure");

		this.passwordTooShort = passwordTooShort;
	}
}

function validatePassword(
	password: string,
): Result<None, ValidatePasswordFailure> {
	const passwordTooShort = password.length < 8;

	const isFailure = passwordTooShort;
	if (isFailure) {
		return Err(new ValidatePasswordFailure({ passwordTooShort }));
	}

	return Ok(None);
}

async function generatePasswordHash(password: string): Promise<string> {
	const salt = await bcrypt.genSalt(10);
	return await bcrypt.hash(password, salt);
}

async function createNewUser({
	email,
	username,
	fullname,
	password,
}: {
	email: string;
	username: string;
	fullname: string;
	password: string;
}): Promise<Result<User, Failure>> {
	const validatePasswordResult = validatePassword(password);
	if (validatePasswordResult.err) return validatePasswordResult;

	const id = generateUserId();
	const passwordHash = await generatePasswordHash(password);

	return Ok({
		id,
		email,
		username,
		passwordHash,
		fullname,
		blocked: false,
		isAdmin: false,
	});
}

type SignUpWithEmailRequest = {
	email: string;
	username: string;
	fullname: string;
	password: string;
};

export class SignUpWithEmailUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		request: SignUpWithEmailRequest,
	): Promise<Result<User, Failure>> {
		const userResult = await createNewUser(request);
		if (userResult.err) return userResult;
		const user = userResult.val;

		const createResult = await this.userRepository.create(user);
		if (createResult.err) return createResult;

		return Ok(user);
	}
}

export function jsonSignUpWithEmailController(
	json: any,
): Result<SignUpWithEmailRequest, BadRequestFailure> {
	const isValidJson =
		typeof json.email === "string" &&
		typeof json.username === "string" &&
		typeof json.fullname === "string" &&
		typeof json.password === "string";
	if (!isValidJson) return Err(new BadRequestFailure());

	return Ok({
		email: json.email,
		username: json.username,
		fullname: json.fullname,
		password: json.password,
	});
}

export function signUpHttpFailurePresenter(failure: Failure): HttpFailure {
	if (failure instanceof ValidatePasswordFailure) {
		return new JsonHttpFailure(422, {
			passwordTooShort: failure.passwordTooShort,
		});
	}

	if (failure instanceof UsernameIsTakenFailure) {
		return new JsonHttpFailure(409, {
			usernameIsTaken: true,
		});
	}

	if (failure instanceof EmailIsTakenFailure) {
		return new JsonHttpFailure(409, {
			emailIsTaken: true,
		});
	}

	return httpFailurePresenter(failure);
}

import { Request, Response } from "express";
import "express-session";

export class ExpressSignUpWithEmail {
	signUpWithEmail: SignUpWithEmailUseCase;

	constructor(signUpWithEmail: SignUpWithEmailUseCase) {
		this.execute = this.execute.bind(this);
		this.signUpWithEmail = signUpWithEmail;
	}

	async execute(req: Request, res: Response): Promise<void> {
		const json = req.body;

		const controllerResult = jsonSignUpWithEmailController(json);
		if (controllerResult.err) {
			const failure = controllerResult.val;
			const httpFailure = httpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const request = controllerResult.val;

		const signUpResult = await this.signUpWithEmail.execute(request);
		if (signUpResult.err) {
			const failure = signUpResult.val;
			const httpFailure = signUpHttpFailurePresenter(failure);
			expressSendHttpFailure(httpFailure, res);
			return;
		}
		const newUser = signUpResult.val;

		req.session.regenerate(() => {
			//@ts-ignore
			req.session.userId = newUser.id;
			res.status(200).json(req.session);
		});
	}
}
