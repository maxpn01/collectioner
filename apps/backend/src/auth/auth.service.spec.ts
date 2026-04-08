import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { User } from '../users/user.entity';
import { UserRepository } from '../users/user.repository';
import { AuthService } from './auth.service';

type MockUserRepository = {
	findAllByEmailOrUsername: jest.Mock;
	createUser: jest.Mock;
	findOneByEmail: jest.Mock;
	findOneById: jest.Mock;
	updateRefreshTokenHash: jest.Mock;
};

type MockJwtService = {
	signAsync: jest.Mock;
	verifyAsync: jest.Mock;
};

type MockConfigService = {
	get: jest.Mock;
	getOrThrow: jest.Mock;
};

const createUser = (overrides: Partial<User> = {}): User => ({
	id: 1,
	email: 'user@example.com',
	username: 'user',
	passwordHash: 'stored-password-hash',
	refreshTokenHash: null,
	fullname: 'User Name',
	blocked: false,
	isAdmin: false,
	...overrides,
});

describe('AuthService', () => {
	let service: AuthService;
	let userRepository: MockUserRepository;
	let jwtService: MockJwtService;
	let configService: MockConfigService;

	beforeEach(() => {
		userRepository = {
			findAllByEmailOrUsername: jest.fn(),
			createUser: jest.fn(),
			findOneByEmail: jest.fn(),
			findOneById: jest.fn(),
			updateRefreshTokenHash: jest.fn(),
		};

		jwtService = {
			signAsync: jest.fn(),
			verifyAsync: jest.fn(),
		};

		configService = {
			get: jest.fn(),
			getOrThrow: jest.fn(),
		};

		service = new AuthService(
			userRepository as unknown as UserRepository,
			jwtService as unknown as JwtService,
			configService as unknown as ConfigService,
		);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('setRefreshTokenCookie', () => {
		it('sets the refresh token cookie with non-production defaults', () => {
			const cookie = jest.fn();
			const res = {
				cookie,
			} as unknown as Response;
			configService.get.mockImplementation((key: string) => {
				if (key === 'NODE_ENV') return 'development';
				if (key === 'JWT_REFRESH_EXPIRES_IN') return '3600';
				return undefined;
			});

			service.setRefreshTokenCookie(res, 'refresh-token');

			expect(cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', {
				httpOnly: true,
				sameSite: 'lax',
				secure: false,
				maxAge: 3600 * 1000,
				path: '/api/auth',
			});
		});
	});

	describe('clearRefreshTokenCookie', () => {
		it('clears the refresh token cookie', () => {
			const clearCookie = jest.fn();
			const res = {
				clearCookie,
			} as unknown as Response;
			configService.get.mockImplementation((key: string) =>
				key === 'NODE_ENV' ? 'production' : undefined,
			);

			service.clearRefreshTokenCookie(res);

			expect(clearCookie).toHaveBeenCalledWith('refreshToken', {
				httpOnly: true,
				sameSite: 'lax',
				secure: true,
				path: '/api/auth',
			});
		});
	});

	describe('signUp', () => {
		it('throws when both email and username are already taken', async () => {
			userRepository.findAllByEmailOrUsername.mockResolvedValue([
				createUser({ email: 'taken@example.com', username: 'taken' }),
			]);

			await expect(
				service.signUp({
					email: 'taken@example.com',
					username: 'taken',
					password: 'password123',
				}),
			).rejects.toThrow(ConflictException);

			await expect(
				service.signUp({
					email: 'taken@example.com',
					username: 'taken',
					password: 'password123',
				}),
			).rejects.toMatchObject({
				response: { emailIsTaken: true, usernameIsTaken: true },
			});
		});

		it('creates a user and returns issued tokens', async () => {
			const createdUser = createUser({ id: 42 });
			userRepository.findAllByEmailOrUsername.mockResolvedValue([]);
			userRepository.createUser.mockResolvedValue(createdUser);
			userRepository.updateRefreshTokenHash.mockResolvedValue(undefined);
			configService.getOrThrow.mockReturnValue('refresh-secret');
			jwtService.signAsync
				.mockResolvedValueOnce('access-token')
				.mockResolvedValueOnce('refresh-token');

			jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
			jest
				.spyOn(bcrypt, 'hash')
				.mockResolvedValueOnce('password-hash' as never)
				.mockResolvedValueOnce('refresh-token-hash' as never);

			await expect(
				service.signUp({
					email: 'user@example.com',
					username: 'user',
					password: 'password123',
				}),
			).resolves.toEqual({
				accessToken: 'access-token',
				refreshToken: 'refresh-token',
				userId: '42',
			});

			expect(userRepository.createUser).toHaveBeenCalledWith(
				'user@example.com',
				'user',
				'password-hash',
			);
			expect(userRepository.updateRefreshTokenHash).toHaveBeenCalledWith(
				42,
				'refresh-token-hash',
			);
		});

		it('translates a unique violation into a conflict response', async () => {
			const uniqueViolation = new QueryFailedError('INSERT', [], {
				code: '23505',
			} as Error & { code: string });

			userRepository.findAllByEmailOrUsername
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([
					createUser({ email: 'taken@example.com', username: 'taken' }),
				]);
			userRepository.createUser.mockRejectedValue(uniqueViolation);

			jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
			jest.spyOn(bcrypt, 'hash').mockResolvedValue('password-hash' as never);

			await expect(
				service.signUp({
					email: 'taken@example.com',
					username: 'taken',
					password: 'password123',
				}),
			).rejects.toMatchObject({
				response: { emailIsTaken: true, usernameIsTaken: true },
			});
		});
	});

	describe('signIn', () => {
		it('throws when the user is missing', async () => {
			userRepository.findOneByEmail.mockResolvedValue(null);

			await expect(
				service.signIn({
					email: 'missing@example.com',
					password: 'password123',
				}),
			).rejects.toThrow(UnauthorizedException);
		});

		it('throws when the password is invalid', async () => {
			userRepository.findOneByEmail.mockResolvedValue(createUser());
			jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

			await expect(
				service.signIn({
					email: 'user@example.com',
					password: 'wrong-password',
				}),
			).rejects.toThrow(UnauthorizedException);
		});

		it('returns tokens for valid credentials', async () => {
			const user = createUser({ id: 7 });
			userRepository.findOneByEmail.mockResolvedValue(user);
			userRepository.updateRefreshTokenHash.mockResolvedValue(undefined);
			configService.getOrThrow.mockReturnValue('refresh-secret');
			jwtService.signAsync
				.mockResolvedValueOnce('access-token')
				.mockResolvedValueOnce('refresh-token');

			jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
			jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
			jest
				.spyOn(bcrypt, 'hash')
				.mockResolvedValueOnce('refresh-token-hash' as never);

			await expect(
				service.signIn({
					email: 'user@example.com',
					password: 'password123',
				}),
			).resolves.toEqual({
				accessToken: 'access-token',
				refreshToken: 'refresh-token',
				userId: '7',
			});

			expect(userRepository.updateRefreshTokenHash).toHaveBeenCalledWith(
				7,
				'refresh-token-hash',
			);
		});
	});

	describe('refresh', () => {
		it('throws when the refresh token is missing', async () => {
			await expect(service.refresh(undefined)).rejects.toThrow(
				new UnauthorizedException('Refresh token is required'),
			);
		});

		it('throws when the stored refresh token hash is missing', async () => {
			configService.getOrThrow.mockReturnValue('refresh-secret');
			jwtService.verifyAsync.mockResolvedValue({ sub: 1 });
			userRepository.findOneById.mockResolvedValue(
				createUser({ id: 1, refreshTokenHash: null }),
			);

			await expect(service.refresh('refresh-token')).rejects.toThrow(
				new UnauthorizedException('Invalid refresh token'),
			);
		});

		it('throws when the refresh token hash does not match', async () => {
			configService.getOrThrow.mockReturnValue('refresh-secret');
			jwtService.verifyAsync.mockResolvedValue({ sub: 1 });
			userRepository.findOneById.mockResolvedValue(
				createUser({ id: 1, refreshTokenHash: 'stored-refresh-hash' }),
			);
			jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

			await expect(service.refresh('refresh-token')).rejects.toThrow(
				new UnauthorizedException('Invalid refresh token'),
			);
		});

		it('returns a new access token when the refresh token is valid', async () => {
			configService.getOrThrow.mockReturnValue('refresh-secret');
			jwtService.verifyAsync.mockResolvedValue({ sub: 1 });
			jwtService.signAsync.mockResolvedValue('new-access-token');
			userRepository.findOneById.mockResolvedValue(
				createUser({ id: 1, refreshTokenHash: 'stored-refresh-hash' }),
			);
			jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

			await expect(service.refresh('refresh-token')).resolves.toEqual({
				accessToken: 'new-access-token',
			});
		});
	});

	describe('signOut', () => {
		it('returns early when the refresh token is missing', async () => {
			await expect(service.signOut(undefined)).resolves.toBeUndefined();
			expect(userRepository.updateRefreshTokenHash).not.toHaveBeenCalled();
		});

		it('clears the stored refresh token hash for a valid token', async () => {
			configService.getOrThrow.mockReturnValue('refresh-secret');
			jwtService.verifyAsync.mockResolvedValue({ sub: 5 });
			userRepository.updateRefreshTokenHash.mockResolvedValue(undefined);

			await expect(service.signOut('refresh-token')).resolves.toBeUndefined();
			expect(userRepository.updateRefreshTokenHash).toHaveBeenCalledWith(
				5,
				null,
			);
		});

		it('swallows refresh token verification errors', async () => {
			configService.getOrThrow.mockReturnValue('refresh-secret');
			jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));

			await expect(service.signOut('refresh-token')).resolves.toBeUndefined();
			expect(userRepository.updateRefreshTokenHash).not.toHaveBeenCalled();
		});
	});
});
