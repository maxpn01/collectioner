import { signal } from "@preact/signals-react";
import { createContext } from "react";
import { None, Option, Some } from "ts-results";

export interface AuthenticatedUserRepository {
	get(): Option<AuthenticatedUser>;
	set(authenticatedUserOption: Option<AuthenticatedUser>): void;
}

class LocalStorageAuthenticatedUserRepository
	implements AuthenticatedUserRepository
{
	get(): Option<AuthenticatedUser> {
		const userIdOrNull = localStorage.getItem("authenticatedUser.id");
		if (userIdOrNull === null) {
			return None;
		}
		const id = userIdOrNull;

		const username = localStorage.getItem("authenticatedUser.username");
		if (username === null) throw new Error("username must not be null");

		const isAdminString = localStorage.getItem("authenticatedUser.isAdmin");
		if (isAdminString === null) throw new Error("isAdmin must not be null");
		const isAdmin = isAdminString === "true";

		return Some({
			id,
			username,
			isAdmin,
		});
	}

	set(authenticatedUserOption: Option<AuthenticatedUser>) {
		if (authenticatedUserOption.none) {
			localStorage.removeItem("authenticatedUser.id");
			localStorage.removeItem("authenticatedUser.username");
			localStorage.removeItem("authenticatedUser.isAdmin");
			return;
		}
		const authenticatedUser = authenticatedUserOption.val;

		localStorage.setItem("authenticatedUser.id", authenticatedUser.id);
		localStorage.setItem("authenticatedUser.username", authenticatedUser.username);
		localStorage.setItem("authenticatedUser.isAdmin", `${authenticatedUser.isAdmin}`);
	}
}

export type AuthenticatedUser = {
	id: string;
	username: string;
	isAdmin: boolean;
};
export class ViewAuthenticatedUserUseCase {
	repo: AuthenticatedUserRepository;

	constructor(repo: AuthenticatedUserRepository) {
		this.execute = this.execute.bind(this);
		this.repo = repo;
	}

	execute(): Option<AuthenticatedUser> {
		return this.repo.get();
	}
}

type UiAuthenticatedUser = {
	id: string;
	username: string;
	isAdmin: boolean;
	link: string;
};

export function authenticatedUserPresenter(
	authenticatedUser: AuthenticatedUser,
): UiAuthenticatedUser {
	return {
		...authenticatedUser,
		link: `/${authenticatedUser.username}`,
	};
}

export const authenticatedUserState = signal<Option<UiAuthenticatedUser>>(None);

export const localStorageAuthenticatedUserRepository =
	new LocalStorageAuthenticatedUserRepository();
const viewAuthenticatedUserUseCase = new ViewAuthenticatedUserUseCase(
	localStorageAuthenticatedUserRepository,
);
export const ViewAuthenticatedUserUseCaseContext = createContext(
	viewAuthenticatedUserUseCase,
);

authenticatedUserState.value = viewAuthenticatedUserUseCase
	.execute()
	.map(authenticatedUserPresenter);
