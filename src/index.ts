import "node";
import bcrypt from "bcryptjs";
import { Result, Ok, Err, Option, Some, None } from "ts-results";
import { Failure, NotFoundFailure } from "utils/failure";
import { nanoid } from "nanoid";

type User = {
	id: string;
	email: string;
	fullname: string;
	blocked: boolean;
	isAdmin: boolean;
	passwordHash: string;
};
type Topic = {
	id: string;
	name: string;
};
type Collection = {
	owner: User;
	id: string;
	name: string;
	items: Item[];
	topic: Topic;
	image: Option<Buffer>;
	numberFields: ItemField[];
	textFields: ItemField[];
	multilineTextFields: ItemField[];
	checkboxFields: ItemField[];
	dateFields: ItemField[];
};
type Item = {
	id: string;
	name: string;
	tags: string[];
	createdAt: Date;
	numberFields: NumberField[];
	textFields: TextField[];
	multilineTextFields: MultilineTextField[];
	checkboxFields: CheckboxField[];
	dateFields: DateField[];
	likes: Like[];
	comments: Comment[];
};
type ItemField = {
	id: string;
	name: string;
};
type NumberField = {
	id: string;
	field: ItemField;
	value: number;
};
type TextField = {
	id: string;
	field: ItemField;
	value: string;
};
type MultilineTextField = {
	id: string;
	field: ItemField;
	value: string;
};
type CheckboxField = {
	id: string;
	field: ItemField;
	value: boolean;
};
type DateField = {
	id: string;
	field: ItemField;
	value: Date;
};
type Comment = {
	id: string;
	author: User;
	text: string;
	createdAt: Date;
	// likes: Like[]; TODO: Implement if enough time
};

type Like = {
	author: User;
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
