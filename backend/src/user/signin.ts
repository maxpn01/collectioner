import { bcrypt } from "bcryptjs";
import { Failure, NotFoundFailure } from "../utils/failure";
import { UserRepository } from ".";
import { Err, None, Ok, Result } from "ts-results";

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

class SignInWithEmailUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		request: SignInWithEmailRequest,
	): Promise<Result<None, Failure>> {
		const userResult = await this.userRepository.getByEmail(request.email);
		if (userResult.err) {
			const failure = userResult.val;

			if (failure instanceof NotFoundFailure) {
				return Err(new InvalidCredentialsFailure());
			}

			return userResult;
		}

		const user = userResult.val;

		const matches = await checkPasswordMatches(
			request.password,
			user.passwordHash,
		);
		if (!matches) return Err(new InvalidCredentialsFailure());

		return Ok(None);
	}
}
