import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@/components/form";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Link, useNavigate } from "react-router-dom";
import { signInPageRoute } from "./signin";
import { homePageRoute } from "@/home";
import env from "@/env";
import { AuthenticatedUser, AuthenticatedUserRepository, authenticatedUserPresenter, authenticatedUserState, localStorageAuthenticatedUserRepository } from "./auth";
import { Err, None, Ok, Option, Result, Some } from "ts-results";
import { Failure } from "@/utils/failure";
import { createContext, useContext } from "react";
import { computed, useSignalEffect } from "@preact/signals-react";

type SignUpWithEmailService = ({
	email,
	username,
	fullname,
	password,
}: SignUpWithEmailCredentials) => Promise<Result<AuthenticatedUser, Failure>>;

type SignUpWithEmailCredentials = {
	email: string;
	username: string;
	fullname: string;
	password: string;
};

class SignUpWithEmailUseCase {
	signUpWithEmail: SignUpWithEmailService;
	repo: AuthenticatedUserRepository;

	constructor(
		signUpWithEmail: SignUpWithEmailService,
		repo: AuthenticatedUserRepository,
	) {
		this.execute = this.execute.bind(this);
		this.signUpWithEmail = signUpWithEmail;
		this.repo = repo;
	}

	async execute(
		credentials: SignUpWithEmailCredentials,
	): Promise<Result<AuthenticatedUser, Failure>> {
		const result = await this.signUpWithEmail(credentials);
		this.repo.set(result.toOption());
		return result;
	}
}

const httpSignUpWithEmailService: SignUpWithEmailService = async (
	credentials: SignUpWithEmailCredentials,
): Promise<Result<AuthenticatedUser, Failure>> => {
	const res = await fetch(`${env.backendApiBase}/signup/email`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(credentials),
	});
	if (!res.ok) {
		return Err(new Failure());
	}
	const json = await res.json();

	const authenticatedUser: AuthenticatedUser = json;
	return Ok(authenticatedUser);
};

const dummySignInWithEmailService: SignUpWithEmailService = async () => {
	return Ok({ id: "john", username: "john", isAdmin: true })
}

const SignUpWithEmailUseCaseContext = createContext(
	new SignUpWithEmailUseCase(
		env.isProduction
			? httpSignUpWithEmailService
			: httpSignUpWithEmailService,
		localStorageAuthenticatedUserRepository,
	),
);

const redirectLinkOption = computed<Option<string>>(() => {
	const authenticatedUserOption = authenticatedUserState.value;
	if (authenticatedUserOption.none) return None;
	return Some(homePageRoute);
});

export const signUpPageRoute = "/sign-up" as const;
export function SignUpPage() {
	const navigate = useNavigate();

	useSignalEffect(() => {
		if (redirectLinkOption.value.none) return;

		navigate(redirectLinkOption.value.val);
	});

	return (
		<div className="flex items-center justify-center min-h-screen bg-slate-50">
			<div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
				<Link
					to={homePageRoute}
					className="block w-full my-8 text-5xl text-center great-vibes-regular"
				>
					Collectioner
				</Link>

				<h1 className="sr-only">Sign up</h1>

				<SignUpForm />

				<p className="mb-1 text-sm">
					Already have an account?{" "}
					<Link to={signInPageRoute} className="text-blue-600">
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
}

const signUpSchema = z.object({
	fullname: z.string(),
	username: z.string(),
	email: z.string().email({ message: "Invalid email address" }),
	password: z
		.string()
		.min(10, { message: "Password must be at least 10 characters" }),
});

function SignUpForm() {
	const signUpWithEmail = useContext(SignUpWithEmailUseCaseContext);

	const form = useForm({
		resolver: zodResolver(signUpSchema),
	});

	const onSubmit = async (form: any) => {
		const result = await signUpWithEmail.execute(form);
		if (result.err) throw result;
		const authenticatedUser = result.val;

		authenticatedUserState.value = Some(
			authenticatedUserPresenter(authenticatedUser),
		);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="fullname"
					render={({ field, fieldState }) => (
						<FormItem>
							<FormLabel>Full Name</FormLabel>
							<FormControl>
								<Input
									placeholder="John Doe"
									{...field}
									value={field.value ?? ""}
								/>
							</FormControl>
							{fieldState.error && (
								<FormMessage>{fieldState.error.message}</FormMessage>
							)}
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="username"
					render={({ field, fieldState }) => (
						<FormItem>
							<FormLabel>Username</FormLabel>
							<FormControl>
								<Input
									placeholder="johndoe123"
									{...field}
									value={field.value ?? ""}
								/>
							</FormControl>
							{fieldState.error && (
								<FormMessage>{fieldState.error.message}</FormMessage>
							)}
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="email"
					render={({ field, fieldState }) => (
						<FormItem>
							<FormLabel>Email Address</FormLabel>
							<FormControl>
								<Input
									placeholder="you@example.com"
									{...field}
									value={field.value ?? ""}
								/>
							</FormControl>
							{fieldState.error && (
								<FormMessage>{fieldState.error.message}</FormMessage>
							)}
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field, fieldState }) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<FormControl>
								<Input
									type="password"
									placeholder="*****"
									{...field}
									value={field.value ?? ""}
								/>
							</FormControl>
							{fieldState.error && (
								<FormMessage>{fieldState.error.message}</FormMessage>
							)}
						</FormItem>
					)}
				/>
				<Button type="submit" className="w-full" size="lg">
					Sign up
				</Button>
			</form>
		</Form>
	);
}
