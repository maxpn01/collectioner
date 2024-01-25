import { Button } from "@/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/form";
import { Input } from "@/components/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
// import { Checkbox } from "@/ui/components/checkbox";
import env from "@/env";
import { homePageRoute } from "@/home";
import { Failure } from "@/utils/failure";
import { computed, useSignalEffect } from "@preact/signals-react";
import { createContext, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Err, None, Ok, Option, Result, Some } from "ts-results";
import {
	AuthenticatedUser,
	AuthenticatedUserRepository,
	authenticatedUserPresenter,
	authenticatedUserState,
	localStorageAuthenticatedUserRepository,
} from "./auth";
import { signUpPageRoute } from "./signup";

type SignInWithEmailService = ({
	email,
	password,
}: SignInWithEmailCredentials) => Promise<Result<AuthenticatedUser, Failure>>;

type SignInWithEmailCredentials = {
	email: string;
	password: string;
};

class SignInWithEmailUseCase {
	signInWithEmail: SignInWithEmailService;
	repo: AuthenticatedUserRepository;

	constructor(
		signInWithEmail: SignInWithEmailService,
		repo: AuthenticatedUserRepository,
	) {
		this.execute = this.execute.bind(this);
		this.signInWithEmail = signInWithEmail;
		this.repo = repo;
	}

	async execute(
		credentials: SignInWithEmailCredentials,
	): Promise<Result<AuthenticatedUser, Failure>> {
		const result = await this.signInWithEmail(credentials);
		this.repo.set(result.toOption());
		return result;
	}
}

const httpSignInWithEmailService: SignInWithEmailService = async (
	credentials: SignInWithEmailCredentials,
): Promise<Result<AuthenticatedUser, Failure>> => {
	const res = await fetch(`${env.backendApiBase}/signin/email`, {
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

// const dummySignInWithEmailService: SignInWithEmailService = async () => {
// 	return Ok({ id: "john", username: "john", isAdmin: true })
// }

const SignInWithEmailUseCaseContext = createContext(
	new SignInWithEmailUseCase(
		env.isProduction
			? httpSignInWithEmailService
			: httpSignInWithEmailService,
		localStorageAuthenticatedUserRepository,
	),
);

const redirectLinkOption = computed<Option<string>>(() => {
	const authenticatedUserOption = authenticatedUserState.value;
	if (authenticatedUserOption.none) return None;
	return Some(homePageRoute);
});

export const signInPageRoute = "/sign-in" as const;
export function SignInPage() {
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

				<h1 className="sr-only">Sign in</h1>

				<SignInForm />

				<p className="text-sm">
					Don't have an account?{" "}
					<Link to={signUpPageRoute} className="text-blue-600">
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}

const signInSchema = z.object({
	email: z
		.string()
		.email({ message: "Invalid email address" })
		.min(1, { message: "Email is required" }),
	password: z.string(),
});

function SignInForm() {
	const signInWithEmail = useContext(SignInWithEmailUseCaseContext);

	const form = useForm({
		resolver: zodResolver(signInSchema),
	});

	const onSubmit = async (form: any) => {
		const result = await signInWithEmail.execute(form);
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
					name="email"
					render={({ field, fieldState }) => (
						<FormItem>
							<FormLabel>Email address</FormLabel>
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
				{/* <div className="flex items-center justify-between">
					<div className="flex items-end space-x-2">
						<Checkbox id="remember-me" name="remember-me" />
						<label
							htmlFor="remember-me"
							className="text-sm font-medium leading-none"
						>
							Remember me
						</label>
					</div>
					<a href="#" className="text-sm text-blue-600 hover:underline">
						Forgot your password?
					</a>
				</div> */}
				<Button type="submit" className="w-full" size="lg">
					Sign in
				</Button>
			</form>
		</Form>
	);
}
