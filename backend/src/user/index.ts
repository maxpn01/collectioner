import { Err, None, Ok, Result } from "ts-results";
import { Failure, NotFoundFailure } from "../utils/failure";
import { Collection, PrismaCollection } from "../collection";
import { RepoGetIncludedProperties, RepoGetOptions } from "../utils/repository";
import { PrismaClient, Prisma, User as PrismaUser } from "@prisma/client";
import { nullableToOption } from "../utils/ts-results";
import { PrismaErrors } from "../utils/prisma";
import { PrismaTopic } from "../collection/repositories/topic";

export { User as PrismaUser } from "@prisma/client";

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

type GetUserIncludables = {
	collections: Collection[];
};
type GetUserIncludedProperties<O extends GetUserOptions> =
	RepoGetIncludedProperties<GetUserIncludables, O>;
type GetUserOptions = RepoGetOptions<GetUserIncludables>;
type GetUserResult<O extends GetUserOptions> = {
	user: User;
} & RepoGetIncludedProperties<GetUserIncludables, O>;

export interface UserRepository {
	get<O extends GetUserOptions>(
		id: string,
		options?: O,
	): Promise<Result<GetUserResult<O>, Failure>>;
	getByEmail<O extends GetUserOptions>(
		email: string,
		options?: O,
	): Promise<Result<GetUserResult<O>, Failure>>;
	create(user: User): Promise<Result<None, Failure>>;
	update(id: string, user: User): Promise<Result<None, Failure>>;
	delete(id: string): Promise<Result<None, Failure>>;
}

class PrismaUserRepository implements UserRepository {
	private prisma: PrismaClient;

	constructor() {
		this.prisma = new PrismaClient();
	}

	async get<O extends GetUserOptions>(
		id: string,
		options?: O,
	): Promise<Result<GetUserResult<O>, Failure>> {
		const prismaCollectionsInclude = (options?.include?.collections && {
			include: {
				topic: options?.include?.collections,
			},
		})!;

		const prismaUser = await this.prisma.user.findUnique({
			where: { id },
			include: {
				collections: prismaCollectionsInclude,
			},
		});
		if (!prismaUser) return Err(new NotFoundFailure());

		const user: User = prismaUserToEntity(prismaUser);
		const includables: Partial<GetUserIncludables> = {};

		if (options?.include?.collections) {
			const prismaCollections = prismaUser.collections;
			includables.collections = prismaCollections.map((pc) =>
				prismaCollectionToEntity(pc, pc.topic, user),
			);
		}

		return Ok({
			user,
			...(includables as GetUserIncludedProperties<O>),
		});
	}

	async getByEmail<O extends GetUserOptions>(
		email: string,
		options?: O,
	): Promise<Result<GetUserResult<O>, Failure>> {
		const prismaCollectionsInclude = (options?.include?.collections && {
			include: {
				topic: options?.include?.collections,
			},
		})!;

		const prismaUser = await this.prisma.user.findUnique({
			where: { email },
			include: {
				collections: prismaCollectionsInclude,
			},
		});
		if (!prismaUser) return Err(new NotFoundFailure());

		const user: User = prismaUserToEntity(prismaUser);
		const includables: Partial<GetUserIncludables> = {};

		if (options?.include?.collections) {
			const prismaCollections = prismaUser.collections;
			includables.collections = prismaCollections.map((pc) =>
				prismaCollectionToEntity(pc, pc.topic, user),
			);
		}

		return Ok({
			user,
			...(includables as GetUserIncludedProperties<O>),
		});
	}

	async create(user: User): Promise<Result<None, Failure>> {
		try {
			await this.prisma.user.create({ data: user });
		} catch (e) {
			const isPrismaError = e instanceof Prisma.PrismaClientKnownRequestError;
			if (!isPrismaError) throw e;

			if (e.code === PrismaErrors.UniqueConstraintFailed) {
				const target = e.meta?.target as string[];

				if (target.includes("email")) return Err(new EmailIsTakenFailure());
				if (target.includes("username"))
					return Err(new UsernameIsTakenFailure());
			} else throw e;
		}

		return Ok(None);
	}

	async update(id: string, user: User): Promise<Result<None, Failure>> {
		try {
			await this.prisma.user.update({ where: { id }, data: user });
		} catch (e) {
			const isPrismaError = e instanceof Prisma.PrismaClientKnownRequestError;
			if (!isPrismaError) throw e;

			if (e.code === PrismaErrors.UniqueConstraintFailed) {
				const target = e.meta?.target as string[];

				if (target.includes("email")) return Err(new EmailIsTakenFailure());
				if (target.includes("username"))
					return Err(new UsernameIsTakenFailure());
			} else throw e;
		}

		return Ok(None);
	}

	async delete(id: string): Promise<Result<None, Failure>> {
		await this.prisma.user.delete({ where: { id } });
		return Ok(None);
	}
}

export function prismaCollectionToEntity(
	pc: PrismaCollection,
	pcTopic: PrismaTopic,
	owner: User,
) {
	return {
		owner,
		id: pc.id,
		name: pc.name,
		topic: pcTopic,
		imageOption: nullableToOption(pc.image),
	};
}

export function prismaUserToEntity(prismaUser: PrismaUser): User {
	return prismaUser;
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
		const { user: requester } = requesterResult.val;

		return authorizeUserUpdate(id, requester);
	}
}
