import type { Request } from 'express';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

type MockUsersService = {
	getUserById: jest.Mock;
	deleteUserById: jest.Mock;
	setAdmin: jest.Mock;
	setBlocked: jest.Mock;
};

type MockAuthRequest = Request & { user: { sub: number } };

const createUser = (overrides: Record<string, unknown> = {}) => ({
	id: 1,
	username: 'user',
	fullname: 'User Name',
	blocked: false,
	isAdmin: false,
	...overrides,
});

describe('UsersController', () => {
	let controller: UsersController;
	let usersService: MockUsersService;

	beforeEach(() => {
		usersService = {
			getUserById: jest.fn(),
			deleteUserById: jest.fn(),
			setAdmin: jest.fn(),
			setBlocked: jest.fn(),
		};

		controller = new UsersController(usersService as unknown as UsersService);
	});

	describe('viewMe', () => {
		it('returns a limited response for blocked users', async () => {
			usersService.getUserById.mockResolvedValue(
				createUser({ id: 7, blocked: true }),
			);

			await expect(
				controller.viewMe({ user: { sub: 7 } } as MockAuthRequest),
			).resolves.toEqual({
				id: 7,
				blocked: true,
			});
			expect(usersService.getUserById).toHaveBeenCalledWith(7);
		});

		it('returns public profile fields for unblocked users', async () => {
			usersService.getUserById.mockResolvedValue(
				createUser({ id: 7, username: 'alice', fullname: 'Alice' }),
			);

			await expect(
				controller.viewMe({ user: { sub: 7 } } as MockAuthRequest),
			).resolves.toEqual({
				id: 7,
				username: 'alice',
				fullname: 'Alice',
			});
		});
	});

	describe('viewUser', () => {
		it('returns a limited response for blocked users', async () => {
			usersService.getUserById.mockResolvedValue(
				createUser({ id: 5, blocked: true }),
			);

			await expect(controller.viewUser(5)).resolves.toEqual({
				id: 5,
				blocked: true,
			});
		});

		it('returns public profile fields for unblocked users', async () => {
			usersService.getUserById.mockResolvedValue(
				createUser({ id: 5, username: 'bob', fullname: 'Bob' }),
			);

			await expect(controller.viewUser(5)).resolves.toEqual({
				id: 5,
				username: 'bob',
				fullname: 'Bob',
			});
		});
	});

	describe('deleteUserById', () => {
		it('delegates deletion to the service', async () => {
			usersService.deleteUserById.mockResolvedValue(undefined);

			await expect(
				controller.deleteUserById({ user: { sub: 3 } } as MockAuthRequest, {
					targetId: 9,
				}),
			).resolves.toBeUndefined();

			expect(usersService.deleteUserById).toHaveBeenCalledWith(3, 9);
		});
	});

	describe('setAdminForUser', () => {
		it('returns the shaped admin response', async () => {
			usersService.setAdmin.mockResolvedValue(
				createUser({
					id: 9,
					username: 'mod',
					fullname: 'Moderator',
					isAdmin: true,
				}),
			);

			await expect(
				controller.setAdminForUser({ user: { sub: 1 } } as MockAuthRequest, {
					targetId: 9,
					isAdmin: true,
				}),
			).resolves.toEqual({
				id: 9,
				username: 'mod',
				fullname: 'Moderator',
				isAdmin: true,
			});

			expect(usersService.setAdmin).toHaveBeenCalledWith(1, 9, true);
		});
	});

	describe('setBlockedForUser', () => {
		it('returns the shaped blocked response', async () => {
			usersService.setBlocked.mockResolvedValue(
				createUser({
					id: 9,
					username: 'bob',
					fullname: 'Bob',
					blocked: true,
				}),
			);

			await expect(
				controller.setBlockedForUser({ user: { sub: 1 } } as MockAuthRequest, {
					targetId: 9,
					blocked: true,
				}),
			).resolves.toEqual({
				id: 9,
				username: 'bob',
				fullname: 'Bob',
				blocked: true,
			});

			expect(usersService.setBlocked).toHaveBeenCalledWith(1, 9, true);
		});
	});
});
