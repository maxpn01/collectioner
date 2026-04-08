import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

type MockAuthService = {
	signUp: jest.Mock;
	signIn: jest.Mock;
	signOut: jest.Mock;
	refresh: jest.Mock;
	setRefreshTokenCookie: jest.Mock;
	clearRefreshTokenCookie: jest.Mock;
};

describe('AuthController', () => {
	let controller: AuthController;
	let authService: MockAuthService;

	beforeEach(() => {
		authService = {
			signUp: jest.fn(),
			signIn: jest.fn(),
			signOut: jest.fn(),
			refresh: jest.fn(),
			setRefreshTokenCookie: jest.fn(),
			clearRefreshTokenCookie: jest.fn(),
		};

		controller = new AuthController(authService as unknown as AuthService);
	});

	describe('signUp', () => {
		it('returns auth data and sets the refresh token cookie', async () => {
			const response = {
				accessToken: 'access-token',
				refreshToken: 'refresh-token',
				userId: '1',
			};
			const res = {} as Response;

			authService.signUp.mockResolvedValue(response);

			await expect(
				controller.signUp(
					{
						email: 'user@example.com',
						username: 'user',
						password: 'password123',
					},
					res,
				),
			).resolves.toEqual(response);

			expect(authService.signUp).toHaveBeenCalledWith({
				email: 'user@example.com',
				username: 'user',
				password: 'password123',
			});
			expect(authService.setRefreshTokenCookie).toHaveBeenCalledWith(
				res,
				'refresh-token',
			);
		});
	});

	describe('signIn', () => {
		it('returns auth data and sets the refresh token cookie', async () => {
			const response = {
				accessToken: 'access-token',
				refreshToken: 'refresh-token',
				userId: '1',
			};
			const res = {} as Response;

			authService.signIn.mockResolvedValue(response);

			await expect(
				controller.signIn(
					{
						email: 'user@example.com',
						password: 'password123',
					},
					res,
				),
			).resolves.toEqual(response);

			expect(authService.signIn).toHaveBeenCalledWith({
				email: 'user@example.com',
				password: 'password123',
			});
			expect(authService.setRefreshTokenCookie).toHaveBeenCalledWith(
				res,
				'refresh-token',
			);
		});
	});

	describe('signOut', () => {
		it('reads the refresh token from cookies and clears the cookie', async () => {
			const req = {
				cookies: { refreshToken: 'cookie-token' },
			} as unknown as Request;
			const res = {} as Response;

			authService.signOut.mockResolvedValue(undefined);

			await expect(controller.signOut(req, res)).resolves.toBeUndefined();

			expect(authService.signOut).toHaveBeenCalledWith('cookie-token');
			expect(authService.clearRefreshTokenCookie).toHaveBeenCalledWith(res);
		});

		it('passes undefined when the request has no refresh token', async () => {
			const req = {} as Request;
			const res = {} as Response;

			authService.signOut.mockResolvedValue(undefined);

			await controller.signOut(req, res);

			expect(authService.signOut).toHaveBeenCalledWith(undefined);
		});
	});

	describe('refresh', () => {
		it('prefers the refresh token from cookies', () => {
			const req = {
				cookies: { refreshToken: 'cookie-token' },
			} as unknown as Request;
			const response = { accessToken: 'new-access-token' };

			authService.refresh.mockReturnValue(response);

			expect(controller.refresh(req, { refreshToken: 'body-token' })).toEqual(
				response,
			);
			expect(authService.refresh).toHaveBeenCalledWith('cookie-token');
		});

		it('uses the refresh token from the body when cookies are missing', () => {
			const req = {} as Request;
			const response = { accessToken: 'new-access-token' };

			authService.refresh.mockReturnValue(response);

			expect(controller.refresh(req, { refreshToken: 'body-token' })).toEqual(
				response,
			);
			expect(authService.refresh).toHaveBeenCalledWith('body-token');
		});

		it('passes undefined when neither cookies nor body contain a token', () => {
			const req = {} as Request;
			const response = { accessToken: 'new-access-token' };

			authService.refresh.mockReturnValue(response);

			expect(controller.refresh(req, {})).toEqual(response);
			expect(authService.refresh).toHaveBeenCalledWith(undefined);
		});
	});
});
