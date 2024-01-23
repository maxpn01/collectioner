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
// import { Checkbox } from "@/ui/components/checkbox";
import { Link } from "react-router-dom";
import { homePageRoute } from "@/home";
import { signUpPageRoute } from "./signup";

export const signInPageRoute = "/sign-in" as const;
export function SignInPage() {
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
	const form = useForm({
		resolver: zodResolver(signInSchema),
	});

	const onSubmit = (values: any) => {
		console.log(values);
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
