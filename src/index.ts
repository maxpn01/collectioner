import "node";
import bcrypt from "bcryptjs";
import { Result, Ok, Err, Option, Some, None } from "ts-results";
import { Failure } from "utils/failure";
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
};
type ItemField = {
	id: string;
	name: string;
};
type NumberField = {
	field: ItemField;
	value: number;
};
type TextField = {
	field: ItemField;
	value: string;
};
type MultilineTextField = {
	field: ItemField;
	value: string;
};
type CheckboxField = {
	field: ItemField;
	value: boolean;
};
type DateField = {
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

interface UserRepository {
	get(id: string): Promise<Result<User, Failure>>;
	create(user: User): Promise<Result<None, Failure>>;
}

class PasswordTooShort extends Failure {}

function validatePassword(password: string): Failure[] {
	const failures: Failure[] = [];

	if (password.length < 8) {
		failures.push(new PasswordTooShort());
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
		const result1 = await createNewUser(request);
		if (result1.err) return result1;

		const result2 = await this.userRepository.create(result1.val);
		if (result2.err) return Err([result2.val]);

		return Ok(None);
	}
}
