import { z } from 'zod';

export const signupSchema = z.object({
	email: z.email().trim().toLowerCase(),
	username: z
		.string()
		.trim()
		.min(3, 'Username must be at least 3 characters long')
		.max(32, 'Username must be at most 32 characters long')
		.regex(
			/^[a-zA-Z0-9_]+$/,
			'Username can only contain letters, numbers, and underscores',
		),
	password: z
		.string()
		.trim()
		.min(8, 'Password must be at least 8 characters long')
		.max(72, 'Password must be at most 72 characters long'),
});

export const signinSchema = z.object({
	email: z.email().trim().toLowerCase(),
	password: z.string().trim().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
	refreshToken: z
		.string()
		.trim()
		.min(1, 'Refresh token is required')
		.optional(),
});

export type SignupDto = z.infer<typeof signupSchema>;
export type SigninDto = z.infer<typeof signinSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;

export type AuthResponse = {
	accessToken: string;
	refreshToken?: string;
	userId?: string;
};
