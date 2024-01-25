import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import {
	BadRequestFailure,
	Failure,
	ValidateLengthFailure,
} from "../utils/failure";
import {
	User,
	UserRepository,
	EmailIsTakenFailure,
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

class InvalidEmailFailure extends Failure {}
class ValidateUsernameFailure extends Failure {
	satisfiesMinLength: boolean;
	satisfiesMaxLength: boolean;
	hasValidCharacters: boolean;

	constructor({
		satisfiesMinLength,
		satisfiesMaxLength,
		hasValidCharacters,
	}: {
		satisfiesMinLength: boolean;
		satisfiesMaxLength: boolean;
		hasValidCharacters: boolean;
	}) {
		super();

		const isValid =
			satisfiesMinLength && satisfiesMaxLength && hasValidCharacters;
		if (isValid) throw new Error("This failure is not really a failure");

		this.satisfiesMinLength = satisfiesMinLength;
		this.satisfiesMaxLength = satisfiesMaxLength;
		this.hasValidCharacters = hasValidCharacters;
	}
}
class ValidateFullnameFailure extends ValidateLengthFailure {}
class ValidatePasswordFailure extends ValidateLengthFailure {}

function validateEmail(email: string): Result<None, InvalidEmailFailure> {
	const emailRegex =
		/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	const correctFormat = emailRegex.test(email);

	const isValid = correctFormat;
	if (!isValid) return Err(new InvalidEmailFailure());

	return Ok(None);
}

function validateUsername(
	username: string,
): Result<None, ValidateUsernameFailure> {
	const satisfiesMinLength = username.length >= 1;
	const satisfiesMaxLength = username.length <= 50;
	const hasValidCharacters = /^[a-zA-Z0-9._-]+$/.test(username);

	const isValid =
		satisfiesMinLength && satisfiesMaxLength && hasValidCharacters;
	if (!isValid) {
		return Err(
			new ValidateUsernameFailure({
				satisfiesMinLength,
				satisfiesMaxLength,
				hasValidCharacters,
			}),
		);
	}

	return Ok(None);
}

function validateFullname(
	fullname: string,
): Result<None, ValidateFullnameFailure> {
	const satisfiesMinLength = fullname.length >= 1;
	const satisfiesMaxLength = fullname.length <= 50;

	const isValid = satisfiesMinLength && satisfiesMaxLength;
	if (!isValid) {
		return Err(
			new ValidateFullnameFailure({
				satisfiesMinLength,
				satisfiesMaxLength,
			}),
		);
	}

	return Ok(None);
}

function validatePassword(
	password: string,
): Result<None, ValidatePasswordFailure> {
	const satisfiesMinLength = password.length >= 10;
	const satisfiesMaxLength = password.length <= 100;

	const isValid = satisfiesMinLength && satisfiesMaxLength;
	if (!isValid) {
		return Err(
			new ValidatePasswordFailure({ satisfiesMinLength, satisfiesMaxLength }),
		);
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
	const validateEmailResult = validateEmail(email);
	if (validateEmailResult.err) return validateEmailResult;

	const validateUsernameResult = validateUsername(username);
	if (validateUsernameResult.err) return validateUsernameResult;

	const validateFullnameResult = validateFullname(fullname);
	if (validateFullnameResult.err) return validateFullnameResult;

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

type SignUpWithEmailResponse = {
	id: string;
	username: string;
	isAdmin: boolean;
};

export class SignUpWithEmailUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		request: SignUpWithEmailRequest,
	): Promise<Result<SignUpWithEmailResponse, Failure>> {
		const userResult = await createNewUser(request);
		if (userResult.err) return userResult;
		const user = userResult.val;

		const createResult = await this.userRepository.create(user);
		if (createResult.err) return createResult;

		return Ok({
			id: user.id,
			username: user.username,
			isAdmin: user.isAdmin,
		});
	}
}

function jsonSignUpWithEmailResponsePresenter(
	response: SignUpWithEmailResponse,
): any {
	return {
		id: response.id,
		username: response.username,
		isAdmin: response.isAdmin,
	};
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
	if (failure instanceof InvalidEmailFailure) {
		return new JsonHttpFailure(422, {
			invalidEmail: true,
		});
	}

	if (failure instanceof ValidateUsernameFailure) {
		return new JsonHttpFailure(422, {
			satisfiesMinLength: failure.satisfiesMinLength,
			satisfiesMaxLength: failure.satisfiesMaxLength,
			hasValidCharacters: failure.hasValidCharacters,
		});
	}

	if (failure instanceof ValidateFullnameFailure) {
		return new JsonHttpFailure(422, {
			satisfiesMinLength: failure.satisfiesMinLength,
			satisfiesMaxLength: failure.satisfiesMaxLength,
		});
	}

	if (failure instanceof ValidatePasswordFailure) {
		return new JsonHttpFailure(422, {
			satisfiesMinLength: failure.satisfiesMinLength,
			satisfiesMaxLength: failure.satisfiesMaxLength,
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
			const json = jsonSignUpWithEmailResponsePresenter(newUser);
			res.status(200).json(json);
		});
	}
}
