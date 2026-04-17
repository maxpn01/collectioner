import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Query,
	Req,
	UseGuards,
	UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '../shared/pipes/zod-validation-pipe/zod-validation.pipe';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type {
	AdminViewUsersDto,
	AuthRequest,
	DeleteUserDto,
	SetAdminDto,
	SetBlockedDto,
	UpdateMeDto,
} from './users.dto';
import {
	adminViewUsersSchema,
	deleteUserSchema,
	setAdminSchema,
	setBlockedSchema,
	updateMeSchema,
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
				email: user.email,
				blocked: user.blocked,
			};

		return {
			id: user.id,
			username: user.username,
			email: user.email,
			fullname: user.fullname,
			blocked: user.blocked,
			isAdmin: user.isAdmin,
		};
	}

	@Get(':id')
	async viewUser(@Param('id') id: string) {
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

	@Patch('me')
	@UseGuards(JwtAuthGuard)
	@UsePipes(new ZodValidationPipe(updateMeSchema))
	async updateMe(@Req() req: AuthRequest, @Body() body: UpdateMeDto) {
		const user = await this.usersService.updateMe(req.user.sub, body);

		return {
			id: user.id,
			username: user.username,
			email: user.email,
			fullname: user.fullname,
			blocked: user.blocked,
			isAdmin: user.isAdmin,
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

	@Get()
	@UseGuards(JwtAuthGuard)
	async adminViewUsers(
		@Req() req: AuthRequest,
		@Query(new ZodValidationPipe(adminViewUsersSchema))
		query: AdminViewUsersDto,
	) {
		const { page, lastPage } = await this.usersService.getUsersPage(
			req.user.sub,
			query,
		);

		return {
			page: page.map((user) => ({
				id: user.id,
				username: user.username,
				email: user.email,
				fullname: user.fullname,
				blocked: user.blocked,
				isAdmin: user.isAdmin,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			})),
			lastPage,
		};
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
