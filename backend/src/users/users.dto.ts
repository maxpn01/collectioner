import { Request } from 'express';
import { z } from 'zod';

export const userSchema = z.object({
	id: z.uuid(),
	email: z.email(),
	username: z.string(),
	fullname: z.string().nullable(),
	blocked: z.boolean(),
	isAdmin: z.boolean(),
});

export type User = z.infer<typeof userSchema>;

export type AuthRequest = Request & { user: { sub: string } };

export type UserResponse = Pick<
	User,
	'id' | 'username' | 'fullname' | 'blocked'
>;

const targetIdsSchema = z.array(z.uuid()).min(1);

export const updateMeSchema = z.object({
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
	fullname: z
		.string()
		.trim()
		.max(120, 'Full name must be at most 120 characters long')
		.nullable(),
});

export const adminViewUsersSchema = z.object({
	size: z.coerce.number().int().min(1).max(100),
	pageN: z.coerce.number().int().positive(),
});

export const deleteUserSchema = z.object({
	targetIds: targetIdsSchema,
});

export const setAdminSchema = z.object({
	targetIds: targetIdsSchema,
	isAdmin: z.boolean(),
});

export const setBlockedSchema = z.object({
	targetIds: targetIdsSchema,
	blocked: z.boolean(),
});

export type DeleteUserDto = z.infer<typeof deleteUserSchema>;
export type SetAdminDto = z.infer<typeof setAdminSchema>;
export type SetBlockedDto = z.infer<typeof setBlockedSchema>;
export type AdminViewUsersDto = z.infer<typeof adminViewUsersSchema>;
export type UpdateMeDto = z.infer<typeof updateMeSchema>;
