import { Err, None, Ok, Result } from "ts-results";
import { Failure, NotFoundFailure } from "../utils/failure";

export type User = {
	id: string;
	email: string;
	username: string;
	fullname: string;
	blocked: boolean;
	isAdmin: boolean;
	passwordHash: string;
};

class UsernameIsTakenFailure extends Failure {}
class EmailIsTakenFailure extends Failure {}

export interface UserRepository {
	get(id: string): Promise<Result<User, Failure>>;
	getByEmail(email: string): Promise<Result<User, Failure>>;
	create(user: User): Promise<Result<None, Failure>>;
	update(id: string, user: User): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

export class MemoryUserRepository implements UserRepository {
	users: User[];

	constructor(users: User[]) {
		this.users = users;
	}

	async get(id: string): Promise<Result<User, Failure>> {
		const user = structuredClone(this.users.find((u) => u.id === id));
		if (!user) return Err(new NotFoundFailure());
		return Ok(user);
	}

	async getByEmail(email: string): Promise<Result<User, Failure>> {
		const user = this.users.find((u) => u.email === email);
		if (!user) return Err(new NotFoundFailure());
		return Ok(user);
	}

	async create(user: User): Promise<Result<None, Failure>> {
		if (this.users.find((u) => u.username === user.username))
			return Err(new UsernameIsTakenFailure());
		if (this.users.find((u) => u.email === user.email))
			return Err(new EmailIsTakenFailure());

		this.users.push(user);
		return Ok(None);
	}

	async update(id: string, user: User): Promise<Result<None, Failure>> {
		const index = this.users.findIndex((u) => u.id === id);
		if (index === -1) return Err(new NotFoundFailure());
		this.users[index] = user;
		return Ok(None);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		const index = this.users.findIndex((u) => u.id === id);
		if (index === -1) return Err(new NotFoundFailure());
		this.users.splice(index, 1);
		return Ok(None);
	}
}

export function authorizeUserUpdate(userId: string, requester: User) {
	const isSelf = requester.id === userId;
	return isSelf || requester.isAdmin;
}

export class AuthorizeUserUpdateUseCase {
	userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async execute(id: string, requesterId: string): Promise<boolean> {
		if (id === requesterId) return true;

		const requesterResult = await this.userRepository.get(requesterId);
		if (requesterResult.err) throw new Error();
		const requester = requesterResult.val;

		return authorizeUserUpdate(id, requester);
	}
}
