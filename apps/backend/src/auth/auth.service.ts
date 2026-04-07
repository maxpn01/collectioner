import {
	ConflictException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import type { User } from 'src/users/user.entity';
import { UserRepository } from 'src/users/user.repository';
import { AuthResponse, AuthTokens, SigninDto, SignupDto } from './auth.dto';

@Injectable()
export class AuthService {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	setRefreshTokenCookie(res: Response, refreshToken: string) {
		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			sameSite: 'lax',
			secure: this.configService.get<string>('NODE_ENV') === 'production',
			maxAge: this.getRefreshTokenExpirySeconds() * 1000,
			path: '/api/auth',
		});
	}

	clearRefreshTokenCookie(res: Response) {
		res.clearCookie('refreshToken', {
			httpOnly: true,
			sameSite: 'lax',
			secure: this.configService.get<string>('NODE_ENV') === 'production',
			path: '/api/auth',
		});
	}

	async signUp({ email, username, password }: SignupDto): Promise<AuthTokens> {
		const existingUsers = await this.userRepository.findAllByEmailOrUsername(
			email,
			username,
		);

		const emailIsTaken = existingUsers.some((u) => u.email === email);
		const usernameIsTaken = existingUsers.some((u) => u.username === username);

		if (emailIsTaken && usernameIsTaken)
			throw new ConflictException({
				emailIsTaken: true,
				usernameIsTaken: true,
			});
		if (emailIsTaken) throw new ConflictException({ emailIsTaken: true });
		if (usernameIsTaken) throw new ConflictException({ usernameIsTaken: true });

		const salt = await bcrypt.genSalt();
		const passwordHash = await bcrypt.hash(password, salt);
		let user: User;

		try {
			user = await this.userRepository.createUser(
				email,
				username,
				passwordHash,
			);
		} catch (error) {
			if (this.isUniqueViolation(error)) {
				const existingUsers =
					await this.userRepository.findAllByEmailOrUsername(email, username);
				const emailIsTaken = existingUsers.some((u) => u.email === email);
				const usernameIsTaken = existingUsers.some(
					(u) => u.username === username,
				);

				if (emailIsTaken && usernameIsTaken)
					throw new ConflictException({
						emailIsTaken: true,
						usernameIsTaken: true,
					});
				if (emailIsTaken) throw new ConflictException({ emailIsTaken: true });
				if (usernameIsTaken)
					throw new ConflictException({ usernameIsTaken: true });
			}

			throw error;
		}

		return this.issueTokens(user.id);
	}

	async signIn({ email, password }: SigninDto): Promise<AuthTokens> {
		const user = await this.userRepository.findOneByEmail(email);
		if (!user) throw new UnauthorizedException('Invalid credentials');

		const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
		if (!passwordsMatch) throw new UnauthorizedException('Invalid credentials');

		return this.issueTokens(user.id);
	}

	async refresh(refreshToken: string | undefined): Promise<AuthResponse> {
		const payload = await this.verifyRefreshToken(refreshToken);
		const token = refreshToken as string;

		const user = await this.userRepository.findOneById(payload.sub);
		if (!user?.refreshTokenHash)
			throw new UnauthorizedException('Invalid refresh token');

		const refreshTokenMatches = await bcrypt.compare(
			token,
			user.refreshTokenHash,
		);

		if (!refreshTokenMatches)
			throw new UnauthorizedException('Invalid refresh token');

		return {
			accessToken: await this.signAccessToken({ sub: user.id }),
		};
	}

	async signOut(refreshToken: string | undefined): Promise<void> {
		if (!refreshToken) return;

		try {
			const payload = await this.verifyRefreshToken(refreshToken);
			await this.userRepository.updateRefreshTokenHash(payload.sub, null);
		} catch {
			return;
		}
	}

	private async issueTokens(userId: number): Promise<AuthTokens> {
		const payload = { sub: userId };
		const [accessToken, refreshToken] = await Promise.all([
			this.signAccessToken(payload),
			this.signRefreshToken(payload),
		]);
		const refreshTokenHash = await bcrypt.hash(
			refreshToken,
			await bcrypt.genSalt(),
		);

		await this.userRepository.updateRefreshTokenHash(userId, refreshTokenHash);

		return { accessToken, refreshToken };
	}

	private signAccessToken(payload: { sub: number }) {
		return this.jwtService.signAsync(payload);
	}

	private signRefreshToken(payload: { sub: number }) {
		return this.jwtService.signAsync(payload, {
			secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
			expiresIn: this.getRefreshTokenExpirySeconds(),
		});
	}

	private async verifyRefreshToken(refreshToken: string | undefined) {
		if (!refreshToken)
			throw new UnauthorizedException('Refresh token is required');

		try {
			return await this.jwtService.verifyAsync<{ sub: number }>(refreshToken, {
				secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
			});
		} catch {
			throw new UnauthorizedException('Invalid refresh token');
		}
	}

	private getRefreshTokenExpirySeconds() {
		return Number(
			this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? 604800,
		);
	}

	private isUniqueViolation(error: unknown) {
		if (!(error instanceof QueryFailedError)) return false;

		const driverError: unknown = error.driverError;

		return (
			typeof driverError === 'object' &&
			driverError !== null &&
			'code' in driverError &&
			(driverError as { code?: unknown }).code === '23505'
		);
	}
}
