import { Failure } from "@/utils/failure";
import { createContext } from "react";
import { None, Ok, Result } from "ts-results";
import {
	AuthenticatedUserRepository,
	localStorageAuthenticatedUserRepository,
} from "./auth";

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

export const SignOutUseCaseContext = createContext(
	new SignOutUseCase(
		async () => Ok(None),
		localStorageAuthenticatedUserRepository,
	),
);
