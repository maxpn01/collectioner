import { Controller, Delete, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import type {
	DeleteUserAuthRequest,
	GetUserAuthRequest,
	GetUserResponse,
} from './users.dto';

@Controller('users')
export class UsersController {
	constructor(private usersService: UsersService) {}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	async getMe(@Req() req: GetUserAuthRequest): Promise<GetUserResponse> {
		const user = await this.usersService.getUserById(req.user.sub);

		return {
			id: user.id,
			email: user.email,
			username: user.username,
			fullname: user.fullname,
			blocked: user.blocked,
			isAdmin: user.isAdmin,
		};
	}

	@Delete('delete')
	@UseGuards(JwtAuthGuard)
	async deleteUser(@Req() req: DeleteUserAuthRequest): Promise<void> {
		return await this.usersService.deleteUserById(req.user.sub);
	}
}
