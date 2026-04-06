import { Body, Controller, Post, Req, Res, UsePipes } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from 'src/shared/pipes/zod-validation-pipe/zod-validation.pipe';
import { AuthService } from './auth.service';
import {
	refreshSchema,
	signinSchema,
	signupSchema,
	type RefreshDto,
	type SigninDto,
	type SignupDto,
} from './auth.dto';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('signup')
	@UsePipes(new ZodValidationPipe(signupSchema))
	async signUp(
		@Body() signupDto: SignupDto,
		@Res({ passthrough: true }) res: Response,
	) {
		const { accessToken, refreshToken } =
			await this.authService.signUp(signupDto);
		this.authService.setRefreshTokenCookie(res, refreshToken);

		return { accessToken };
	}

	@Post('signin')
	@UsePipes(new ZodValidationPipe(signinSchema))
	async signIn(
		@Body() signinDto: SigninDto,
		@Res({ passthrough: true }) res: Response,
	) {
		const { accessToken, refreshToken } =
			await this.authService.signIn(signinDto);
		this.authService.setRefreshTokenCookie(res, refreshToken);

		return { accessToken };
	}

	@Post('signout')
	async signOut(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		await this.authService.signOut(this.getRefreshTokenFromRequest(req));
		this.authService.clearRefreshTokenCookie(res);
	}

	@Post('refresh')
	@UsePipes(new ZodValidationPipe(refreshSchema))
	refresh(@Req() req: Request, @Body() body: RefreshDto) {
		return this.authService.refresh(this.getRefreshTokenFromRequest(req, body));
	}

	private getRefreshTokenFromRequest(
		req: Request,
		body?: RefreshDto,
	): string | undefined {
		const cookieRefreshToken = req.cookies?.refreshToken as string | undefined;

		if (typeof cookieRefreshToken === 'string') {
			return cookieRefreshToken;
		}

		return typeof body?.refreshToken === 'string'
			? body.refreshToken
			: undefined;
	}
}
