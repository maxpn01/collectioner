import { nanoid } from "nanoid";
import { bcrypt } from "bcryptjs";
import { Failure } from "../utils/failure";
import { User, UserRepository } from ".";
import { Err, None, Ok, Result } from "ts-results";

function generateUserId(): string {
	return nanoid();
}

class PasswordTooShortFailure extends Failure {}

function validatePassword(password: string): Failure[] {
	const failures: Failure[] = [];

	if (password.length < 8) {
		failures.push(new PasswordTooShortFailure());
	}

	return failures;
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
}): Promise<Result<User, Failure[]>> {
	const failures = validatePassword(password);
	if (failures.length > 0) return Err(failures);

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
	): Promise<Result<None, Failure[]>> {
		const userResult = await createNewUser(request);
		if (userResult.err) return userResult;

		const noneResult = await this.userRepository.create(userResult.val);
		if (noneResult.err) return Err([noneResult.val]);

		return Ok(None);
	}
}
