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
import { Link } from "react-router-dom";
import { signInPageRoute } from "./signin";
import { homePageRoute } from "@/home";

export const signUpPageRoute = "/sign-up" as const;
export function SignUpPage() {
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
	fullName: z.string(),
	username: z.string(),
	email: z.string().email({ message: "Invalid email address" }),
	password: z
		.string()
		.min(6, { message: "Password must be at least 6 characters" }),
});

function SignUpForm() {
	const form = useForm({
		resolver: zodResolver(signUpSchema),
	});

	const onSubmit = (values: any) => {
		console.log(values);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="fullName"
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
