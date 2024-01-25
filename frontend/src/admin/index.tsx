import env from "@/env";
import { Failure } from "@/utils/failure";
import { createContext } from "react";
import { Err, None, Ok, Result } from "ts-results";

export const httpUserBlockedSetManyService: UserBlockedSetManyService = async (
	ids: string[],
	blocked: boolean,
): Promise<Result<None, Failure>> => {
	const res = await fetch(`${env.backendApiBase}/user/blocked`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ ids, blocked }),
		credentials: "include",
	});
	if (!res.ok) {
		return Err(new Failure());
	}

	return Ok(None);
};

type UserBlockedSetManyService = (
	ids: string[],
	blocked: boolean,
) => Promise<Result<None, Failure>>;

export class UserBlockedSetManyUseCase {
	userBlockedSetMany: UserBlockedSetManyService;

	constructor(userBlockedSetMany: UserBlockedSetManyService) {
		this.userBlockedSetMany = userBlockedSetMany;
	}
	execute(userIds: string[], blocked: boolean): Promise<Result<None, Failure>> {
		return this.userBlockedSetMany(userIds, blocked);
	}
}
export const UserBlockedSetManyContext = createContext(
	new UserBlockedSetManyUseCase(
		env.isProduction
			? httpUserBlockedSetManyService
			: httpUserBlockedSetManyService,
	),
);

export const httpUserIsAdminSetManyService: UserIsAdminSetManyService = async (
	ids: string[],
	isAdmin: boolean,
): Promise<Result<None, Failure>> => {
	const res = await fetch(`${env.backendApiBase}/user/is-admin`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ ids, isAdmin }),
		credentials: "include",
	});
	if (!res.ok) {
		return Err(new Failure());
	}

	return Ok(None);
};

type UserIsAdminSetManyService = (
	ids: string[],
	isAdmin: boolean,
) => Promise<Result<None, Failure>>;

export class UserIsAdminSetManyUseCase {
	userIsAdminSetMany: UserIsAdminSetManyService;

	constructor(userIsAdminSetMany: UserIsAdminSetManyService) {
		this.userIsAdminSetMany = userIsAdminSetMany;
	}
	execute(userIds: string[], isAdmin: boolean): Promise<Result<None, Failure>> {
		return this.userIsAdminSetMany(userIds, isAdmin);
	}
}
export const UserIsAdminSetManyContext = createContext(
	new UserIsAdminSetManyUseCase(
		env.isProduction
			? httpUserIsAdminSetManyService
			: httpUserIsAdminSetManyService,
	),
);

export const httpUserDeleteManyService: UserDeleteManyService = async (
	ids: string[],
): Promise<Result<None, Failure>> => {
	const res = await fetch(`${env.backendApiBase}/user/`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ ids }),
		credentials: "include",
	});
	if (!res.ok) {
		return Err(new Failure());
	}

	return Ok(None);
};

type UserDeleteManyService = (ids: string[]) => Promise<Result<None, Failure>>;

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
	new UserDeleteManyUseCase(
		env.isProduction ? httpUserDeleteManyService : httpUserDeleteManyService,
	),
);
