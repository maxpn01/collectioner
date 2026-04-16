import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Req,
	UseGuards,
	UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '../shared/pipes/zod-validation-pipe/zod-validation.pipe';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type {
	AuthRequest,
	DeleteUserDto,
	SetAdminDto,
	SetBlockedDto,
} from './users.dto';
import {
	deleteUserSchema,
	setAdminSchema,
	setBlockedSchema,
} from './users.dto';

@Controller('users')
export class UsersController {
	constructor(private usersService: UsersService) {}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	async viewMe(@Req() req: AuthRequest) {
		const user = await this.usersService.getUserById(req.user.sub);

		if (user.blocked)
			return {
				id: user.id,
				blocked: user.blocked,
			};

		return {
			id: user.id,
			username: user.username,
			fullname: user.fullname,
		};
	}

	@Get(':id')
	async viewUser(@Param('id', ParseIntPipe) id: number) {
		const user = await this.usersService.getUserById(id);

		if (user.blocked)
			return {
				id: user.id,
				blocked: user.blocked,
			};

		return {
			id: user.id,
			username: user.username,
			fullname: user.fullname,
		};
	}

	@Delete('delete')
	@UseGuards(JwtAuthGuard)
	@UsePipes(new ZodValidationPipe(deleteUserSchema))
	async deleteUsersByIds(
		@Req() req: AuthRequest,
		@Body() { targetIds }: DeleteUserDto,
	): Promise<void> {
		return await this.usersService.deleteUsersByIds(req.user.sub, targetIds);
	}

	@Patch('admin')
	@UseGuards(JwtAuthGuard)
	@UsePipes(new ZodValidationPipe(setAdminSchema))
	async setAdminForUsers(
		@Req() req: AuthRequest,
		@Body() { targetIds, isAdmin }: SetAdminDto,
	) {
		const users = await this.usersService.setAdminForUsers(
			req.user.sub,
			targetIds,
			isAdmin,
		);

		return users.map((user) => ({
			id: user.id,
			username: user.username,
			fullname: user.fullname,
			isAdmin: user.isAdmin,
		}));
	}

	@Patch('block')
	@UseGuards(JwtAuthGuard)
	@UsePipes(new ZodValidationPipe(setBlockedSchema))
	async setBlockedForUsers(
		@Req() req: AuthRequest,
		@Body() { targetIds, blocked }: SetBlockedDto,
	) {
		const users = await this.usersService.setBlockedForUsers(
			req.user.sub,
			targetIds,
			blocked,
		);

		return users.map((user) => ({
			id: user.id,
			username: user.username,
			fullname: user.fullname,
			blocked: user.blocked,
		}));
	}
}
