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
