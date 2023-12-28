import bcrypt from "bcryptjs";
import { Result, Ok, Err, None } from "ts-results";
import { Failure, NotFoundFailure } from "utils/failure";
import { nanoid } from "nanoid";

export type User = {
	id: string;
	email: string;
	fullname: string;
	blocked: boolean;
	isAdmin: boolean;
	passwordHash: string;
};

class PasswordTooShortFailure extends Failure {}

function validatePassword(password: string): Failure[] {
	const failures: Failure[] = [];

	if (password.length < 8) {
		failures.push(new PasswordTooShortFailure());
	}

	return failures;
}

async function createNewUser({
	email,
	fullname,
	password,
}: {
	email: string;
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
		passwordHash,
		fullname,
		blocked: false,
		isAdmin: false,
	});
}

function generateUserId(): string {
	return nanoid();
}

async function generatePasswordHash(password: string): Promise<string> {
	const salt = await bcrypt.genSalt(10);
	return await bcrypt.hash(password, salt);
}

interface UserRepository {
	get(id: string): Promise<Result<User, Failure>>;
	getByEmail(email: string): Promise<Result<User, Failure>>;
	create(user: User): Promise<Result<None, Failure>>;
	update(id: string, user: User): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

type SignUpWithEmailRequest = {
	fullname: string;
	email: string;
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

type ViewUserResult = {
	id: string;
	fullname: string;
	blocked: boolean;
};
class ViewUserUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(id: string): Promise<Result<ViewUserResult, Failure>> {
		const userResult = await this.userRepository.get(id);

		return userResult.map((user) => {
			return {
				id: user.id,
				fullname: user.fullname,
				blocked: user.blocked,
			};
		});
	}
}

type AdminViewUserResult = {
	id: string;
	email: string;
	fullname: string;
	blocked: boolean;
	isAdmin: boolean;
};

class NotAuthorizedFailure extends Failure {}

class AdminViewUserUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		id: string,
		senderId: string,
		checkSenderIsAuthenticated: () => boolean,
	): Promise<Result<AdminViewUserResult, Failure>> {
		if (!checkSenderIsAuthenticated()) {
			return Err(new NotAuthorizedFailure());
		}

		const senderResult = await this.userRepository.get(senderId);
		if (senderResult.err) return senderResult;

		const sender = senderResult.val;
		if (!sender.isAdmin) {
			return Err(new NotAuthorizedFailure());
		}

		return this.userRepository.get(id);
	}
}

class CheckIsAdminUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(
		senderId: string,
		checkSenderIsAuthenticated: () => boolean,
	): Promise<boolean> {
		if (!checkSenderIsAuthenticated()) return false;

		const senderResult = await this.userRepository.get(senderId);
		if (senderResult.err) throw new Error();

		const sender = senderResult.val;
		return sender.isAdmin;
	}
}

class SetUserBlockedUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(id: string, blocked: boolean): Promise<Result<None, Failure>> {
		const userResult = await this.userRepository.get(id);
		if (userResult.err) return userResult;

		const user = structuredClone(userResult.val);
		user.blocked = blocked;

		const updateResult = await this.userRepository.update(id, user);
		if (updateResult.err) return updateResult;

		return Ok(None);
	}
}

class BlockUserUseCase {
	userRepository: UserRepository;
	checkIsAdminUseCase: CheckIsAdminUseCase;
	setUserBlockedUseCase: SetUserBlockedUseCase;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
		this.checkIsAdminUseCase = new CheckIsAdminUseCase(userRepository);
		this.setUserBlockedUseCase = new SetUserBlockedUseCase(userRepository);
	}

	async execute(
		id: string,
		senderId: string,
		checkSenderIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		const isAdmin = this.checkIsAdminUseCase.execute(
			senderId,
			checkSenderIsAuthenticated,
		);
		if (!isAdmin) return Err(new NotAuthorizedFailure());

		return this.setUserBlockedUseCase.execute(id, true);
	}
}

class UnblockUserUseCase {
	userRepository: UserRepository;
	checkIsAdminUseCase: CheckIsAdminUseCase;
	setUserBlockedUseCase: SetUserBlockedUseCase;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
		this.checkIsAdminUseCase = new CheckIsAdminUseCase(userRepository);
		this.setUserBlockedUseCase = new SetUserBlockedUseCase(userRepository);
	}

	async execute(
		id: string,
		senderId: string,
		checkSenderIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		const isAdmin = this.checkIsAdminUseCase.execute(
			senderId,
			checkSenderIsAuthenticated,
		);
		if (!isAdmin) return Err(new NotAuthorizedFailure());

		return this.setUserBlockedUseCase.execute(id, false);
	}
}

class DeleteUserUseCase {
	userRepository: UserRepository;
	checkIsAdminUseCase: CheckIsAdminUseCase;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
		this.checkIsAdminUseCase = new CheckIsAdminUseCase(userRepository);
	}

	async execute(
		id: string,
		senderId: string,
		checkSenderIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		const isAdmin = this.checkIsAdminUseCase.execute(
			senderId,
			checkSenderIsAuthenticated,
		);
		if (!isAdmin) return Err(new NotAuthorizedFailure());

		const deleteResult = await this.userRepository.delete(id);
		if (deleteResult.err) return deleteResult;

		return Ok(None);
	}
}

class SetUserIsAdminUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(id: string, isAdmin: boolean): Promise<Result<None, Failure>> {
		const userResult = await this.userRepository.get(id);
		if (userResult.err) return userResult;

		const user = structuredClone(userResult.val);
		user.isAdmin = isAdmin;

		const updateResult = await this.userRepository.update(id, user);
		if (updateResult.err) return updateResult;

		return Ok(None);
	}
}

class GrantAdminPrivilegesUseCase {
	userRepository: UserRepository;
	checkIsAdminUseCase: CheckIsAdminUseCase;
	setUserIsAdminUseCase: SetUserIsAdminUseCase;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
		this.checkIsAdminUseCase = new CheckIsAdminUseCase(userRepository);
		this.setUserIsAdminUseCase = new SetUserIsAdminUseCase(userRepository);
	}

	async execute(
		id: string,
		senderId: string,
		checkSenderIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		const isAdmin = this.checkIsAdminUseCase.execute(
			senderId,
			checkSenderIsAuthenticated,
		);
		if (!isAdmin) return Err(new NotAuthorizedFailure());

		return this.setUserIsAdminUseCase.execute(id, true);
	}
}

class RevokeAdminPrivilegesUseCase {
	userRepository: UserRepository;
	checkIsAdminUseCase: CheckIsAdminUseCase;
	setUserIsAdminUseCase: SetUserIsAdminUseCase;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
		this.checkIsAdminUseCase = new CheckIsAdminUseCase(userRepository);
		this.setUserIsAdminUseCase = new SetUserIsAdminUseCase(userRepository);
	}

	async execute(
		id: string,
		senderId: string,
		checkSenderIsAuthenticated: () => boolean,
	): Promise<Result<None, Failure>> {
		const isAdmin = this.checkIsAdminUseCase.execute(
			senderId,
			checkSenderIsAuthenticated,
		);
		if (!isAdmin) return Err(new NotAuthorizedFailure());

		return this.setUserIsAdminUseCase.execute(id, false);
	}
}
