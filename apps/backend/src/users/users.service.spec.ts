import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User } from './user.entity';
import { UserRepository } from './user.repository';
import { UsersService } from './users.service';

type MockUserRepository = {
	findOneById: jest.Mock;
	deleteUser: jest.Mock;
	setUserAdmin: jest.Mock;
	setUserBlocked: jest.Mock;
};

const createUser = (overrides: Partial<User> = {}): User => ({
	id: 1,
	email: 'user@example.com',
	username: 'user',
	passwordHash: 'hash',
	refreshTokenHash: null,
	fullname: 'User Name',
	blocked: false,
	isAdmin: false,
	...overrides,
});

describe('UsersService', () => {
	let service: UsersService;
	let userRepository: MockUserRepository;

	beforeEach(() => {
		userRepository = {
			findOneById: jest.fn(),
			deleteUser: jest.fn(),
			setUserAdmin: jest.fn(),
			setUserBlocked: jest.fn(),
		};

		service = new UsersService(userRepository as unknown as UserRepository);
	});

	describe('getUserById', () => {
		it('returns the user when it exists', async () => {
			const user = createUser();
			userRepository.findOneById.mockResolvedValue(user);

			await expect(service.getUserById(1)).resolves.toBe(user);
			expect(userRepository.findOneById).toHaveBeenCalledWith(1);
		});

		it('throws when the user does not exist', async () => {
			userRepository.findOneById.mockResolvedValue(null);

			await expect(service.getUserById(1)).rejects.toThrow(NotFoundException);
		});
	});

	describe('deleteUserById', () => {
		it('allows a user to delete themselves', async () => {
			userRepository.findOneById
				.mockResolvedValueOnce(createUser({ id: 1, isAdmin: false }))
				.mockResolvedValueOnce(createUser({ id: 1 }));

			await expect(service.deleteUserById(1, 1)).resolves.toBeUndefined();

			expect(userRepository.deleteUser).toHaveBeenCalledWith(1);
		});

		it('rejects deleting another user without admin access', async () => {
			userRepository.findOneById.mockResolvedValue(
				createUser({ id: 1, isAdmin: false }),
			);

			await expect(service.deleteUserById(1, 2)).rejects.toThrow(
				ForbiddenException,
			);
			expect(userRepository.deleteUser).not.toHaveBeenCalled();
		});

		it('throws when an admin tries to delete a missing target', async () => {
			userRepository.findOneById
				.mockResolvedValueOnce(createUser({ id: 1, isAdmin: true }))
				.mockResolvedValueOnce(null);

			await expect(service.deleteUserById(1, 2)).rejects.toThrow(
				NotFoundException,
			);
			expect(userRepository.deleteUser).not.toHaveBeenCalled();
		});

		it('allows an admin to delete another user', async () => {
			userRepository.findOneById
				.mockResolvedValueOnce(createUser({ id: 1, isAdmin: true }))
				.mockResolvedValueOnce(createUser({ id: 2 }));

			await expect(service.deleteUserById(1, 2)).resolves.toBeUndefined();

			expect(userRepository.deleteUser).toHaveBeenCalledWith(2);
		});
	});

	describe('setAdmin', () => {
		it('rejects non-admin actors', async () => {
			userRepository.findOneById.mockResolvedValue(
				createUser({ id: 1, isAdmin: false }),
			);

			await expect(service.setAdmin(1, 2, true)).rejects.toThrow(
				ForbiddenException,
			);
			expect(userRepository.setUserAdmin).not.toHaveBeenCalled();
		});

		it('throws when the target user does not exist', async () => {
			userRepository.findOneById
				.mockResolvedValueOnce(createUser({ id: 1, isAdmin: true }))
				.mockResolvedValueOnce(null);

			await expect(service.setAdmin(1, 2, true)).rejects.toThrow(
				NotFoundException,
			);
			expect(userRepository.setUserAdmin).not.toHaveBeenCalled();
		});

		it('updates the target admin flag', async () => {
			const updatedUser = createUser({ id: 2, isAdmin: true });
			userRepository.findOneById
				.mockResolvedValueOnce(createUser({ id: 1, isAdmin: true }))
				.mockResolvedValueOnce(createUser({ id: 2, isAdmin: false }));
			userRepository.setUserAdmin.mockResolvedValue(updatedUser);

			await expect(service.setAdmin(1, 2, true)).resolves.toBe(updatedUser);
			expect(userRepository.setUserAdmin).toHaveBeenCalledWith(2, true);
		});
	});

	describe('setBlocked', () => {
		it('rejects non-admin actors', async () => {
			userRepository.findOneById.mockResolvedValue(
				createUser({ id: 1, isAdmin: false }),
			);

			await expect(service.setBlocked(1, 2, true)).rejects.toThrow(
				ForbiddenException,
			);
			expect(userRepository.setUserBlocked).not.toHaveBeenCalled();
		});

		it('throws when the target user does not exist', async () => {
			userRepository.findOneById
				.mockResolvedValueOnce(createUser({ id: 1, isAdmin: true }))
				.mockResolvedValueOnce(null);

			await expect(service.setBlocked(1, 2, true)).rejects.toThrow(
				NotFoundException,
			);
			expect(userRepository.setUserBlocked).not.toHaveBeenCalled();
		});

		it('updates the target blocked flag', async () => {
			const updatedUser = createUser({ id: 2, blocked: true });
			userRepository.findOneById
				.mockResolvedValueOnce(createUser({ id: 1, isAdmin: true }))
				.mockResolvedValueOnce(createUser({ id: 2, blocked: false }));
			userRepository.setUserBlocked.mockResolvedValue(updatedUser);

			await expect(service.setBlocked(1, 2, true)).resolves.toBe(updatedUser);
			expect(userRepository.setUserBlocked).toHaveBeenCalledWith(2, true);
		});
	});
});
