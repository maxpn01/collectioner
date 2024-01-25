import { Failure } from "@/utils/failure";
import { createContext } from "react";
import { None, Ok, Result } from "ts-results";

export async function httpSetUserIsAdminService(
	id: string,
	value: boolean,
): Promise<Result<None, Failure>> {
	return Ok(None);
}

export async function httpSetUserBlockedService(
	id: string,
	value: boolean,
): Promise<Result<None, Failure>> {
	return Ok(None);
}

type UserBlockedSetManyService = (
	userIds: string[],
) => Promise<Result<None, Failure>>;

export class UserBlockedSetManyUseCase {
	userBlockedSetMany: UserBlockedSetManyService;

	constructor(userBlockedSetMany: UserBlockedSetManyService) {
		this.userBlockedSetMany = userBlockedSetMany;
	}
	execute(userIds: string[]): Promise<Result<None, Failure>> {
		return this.userBlockedSetMany(userIds);
	}
}
export const UserBlockedSetManyContext = createContext(
	new UserBlockedSetManyUseCase(async (userIds) => Ok(None)),
);

type UserIsAdminSetManyService = (
	userIds: string[],
) => Promise<Result<None, Failure>>;

export class UserIsAdminSetManyUseCase {
	userIsAdminSetMany: UserIsAdminSetManyService;

	constructor(userIsAdminSetMany: UserIsAdminSetManyService) {
		this.userIsAdminSetMany = userIsAdminSetMany;
	}
	execute(userIds: string[]): Promise<Result<None, Failure>> {
		return this.userIsAdminSetMany(userIds);
	}
}
export const UserIsAdminSetManyContext = createContext(
	new UserIsAdminSetManyUseCase(async (userIds) => Ok(None)),
);

type UserDeleteManyService = (
	userIds: string[],
) => Promise<Result<None, Failure>>;

export class UserDeleteManyUseCase {
	userDeleteMany: UserDeleteManyService;

	constructor(userDeleteMany: UserDeleteManyService) {
		this.userDeleteMany = userDeleteMany;
	}

	execute(userIds: string[]): Promise<Result<None, Failure>> {
		return this.userDeleteMany(userIds);
	}
}
export const UserDeleteManyContext = createContext(
	new UserDeleteManyUseCase(async (userIds) => Ok(None)),
);
