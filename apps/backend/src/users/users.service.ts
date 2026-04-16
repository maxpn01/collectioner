import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './user.entity';
import { AdminViewUsersDto } from './users.dto';

@Injectable()
export class UsersService {
	constructor(private userRepository: UserRepository) {}

	async getUserById(id: string): Promise<User> {
		const user = await this.userRepository.findOneById(id);
		if (!user) throw new NotFoundException('User not found');
		return user;
	}

	async deleteUsersByIds(actorId: string, targetIds: string[]): Promise<void> {
		const actor = await this.userRepository.findOneById(actorId);
		const uniqueTargetIds = [...new Set(targetIds)];
		const isSelfDelete =
			uniqueTargetIds.length === 1 && uniqueTargetIds[0] === actorId;

		if (!isSelfDelete && !actor?.isAdmin)
			throw new ForbiddenException('Admin access required');

		const targets = await this.userRepository.findAllByIds(uniqueTargetIds);
		if (targets.length !== uniqueTargetIds.length)
			throw new NotFoundException('Target user not found');

		await this.userRepository.deleteUsers(uniqueTargetIds);
	}

	async getUsersPage(
		actorId: string,
		{ size, pageN }: AdminViewUsersDto,
	): Promise<{ page: User[]; lastPage: number }> {
		const actor = await this.userRepository.findOneById(actorId);
		if (!actor?.isAdmin) throw new ForbiddenException('Admin access required');

		const usersPage = await this.userRepository.getUsersPage(size, pageN);
		if (pageN > usersPage.lastPage)
			throw new NotFoundException('Page not found');

		return usersPage;
	}

	async setAdminForUsers(
		actorId: string,
		targetIds: string[],
		isAdmin: boolean,
	): Promise<User[]> {
		const actor = await this.userRepository.findOneById(actorId);
		if (!actor?.isAdmin) throw new ForbiddenException('Admin access required');

		return await this.userRepository.setUsersAdmin(targetIds, isAdmin);
	}

	async setBlockedForUsers(
		actorId: string,
		targetIds: string[],
		blocked: boolean,
	): Promise<User[]> {
		const actor = await this.userRepository.findOneById(actorId);
		if (!actor?.isAdmin) throw new ForbiddenException('Admin access required');

		return await this.userRepository.setUsersBlocked(targetIds, blocked);
	}
}
