import { nanoid } from "nanoid";
import { bcrypt } from "bcryptjs";
import { Failure } from "../utils/failure";
import { User, UserRepository } from ".";
import { Err, None, Ok, Result } from "ts-results";

function generateUserId(): string {
	return nanoid();
}

class ValidatePasswordFailure extends Failure {
	passwordTooShort: boolean = false;

	isInvalid(): boolean {
		return this.passwordTooShort;
	}
}

function validatePassword(
	password: string,
): Result<None, ValidatePasswordFailure> {
	const failure = new ValidatePasswordFailure();
	failure.passwordTooShort = password.length < 8;

	return failure.isInvalid() ? Err(failure) : Ok(None);
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

class SignUpWithEmailUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		request: SignUpWithEmailRequest,
	): Promise<Result<None, Failure>> {
		const userResult = await createNewUser(request);
		if (userResult.err) return userResult;
		const user = userResult.val;

		const createResult = await this.userRepository.create(user);
		if (createResult.err) return createResult;

		return Ok(None);
	}
}
