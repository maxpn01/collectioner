import { Failure } from "@/utils/failure";
import { createContext } from "react";
import { Err, None, Ok, Result } from "ts-results";
import {
	AuthenticatedUserRepository,
	localStorageAuthenticatedUserRepository,
} from "./auth";
import env from "@/env";

type SignOutService = () => Promise<Result<None, Failure>>;

class SignOutUseCase {
	signOut: SignOutService;
	repo: AuthenticatedUserRepository;

	constructor(signOut: SignOutService, repo: AuthenticatedUserRepository) {
		this.execute = this.execute.bind(this);
		this.signOut = signOut;
		this.repo = repo;
	}

	async execute(): Promise<Result<None, Failure>> {
		const result = await this.signOut();
		if (result.ok) this.repo.set(None);
		return result;
	}
}

const httpSignOutService: SignOutService = async (): Promise<
	Result<None, Failure>
> => {
	const res = await fetch(`${env.backendApiBase}/signout`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
	});
	if (!res.ok) return Err(new Failure());

	return Ok(None);
};

// const dummySignOutService: SignOutService = async () => {
// 	return Ok(None);
// }

export const SignOutUseCaseContext = createContext(
	new SignOutUseCase(
		env.isProduction ? httpSignOutService : httpSignOutService,
		localStorageAuthenticatedUserRepository,
	),
);
