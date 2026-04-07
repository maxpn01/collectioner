import { Request } from 'express';
import { z } from 'zod';

export const userSchema = z.object({
	id: z.number(),
	email: z.email(),
	username: z.string(),
	fullname: z.string().nullable(),
	blocked: z.boolean(),
	isAdmin: z.boolean(),
});

export type GetUserAuthRequest = Request & { user: { sub: number } };
export type GetUserResponse = Omit<
	z.infer<typeof userSchema>,
	'passwordHash' | 'refreshTokenHash'
>;

export type DeleteUserAuthRequest = Request & { user: { sub: number } };
