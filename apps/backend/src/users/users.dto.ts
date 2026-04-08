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

export type User = z.infer<typeof userSchema>;

export type AuthRequest = Request & { user: { sub: number } };

export type UserResponse = Pick<
	User,
	'id' | 'username' | 'fullname' | 'blocked'
>;

export const deleteUserSchema = z.object({
	targetId: z.number().int().positive(),
});

export const setAdminSchema = z.object({
	targetId: z.number().int().positive(),
	isAdmin: z.boolean(),
});

export const setBlockedSchema = z.object({
	targetId: z.number().int().positive(),
	blocked: z.boolean(),
});

export type DeleteUserDto = z.infer<typeof deleteUserSchema>;
export type SetAdminDto = z.infer<typeof setAdminSchema>;
export type SetBlockedDto = z.infer<typeof setBlockedSchema>;
