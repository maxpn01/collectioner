import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './user.entity';

@Injectable()
export class UsersService {
	constructor(private userRepository: UserRepository) {}

	async getUserById(id: number): Promise<User> {
		const user = await this.userRepository.findOneById(id);
		if (!user) throw new NotFoundException('User not found');
		return user;
	}

	async deleteUsersByIds(actorId: number, targetIds: number[]): Promise<void> {
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

	async setAdminForUsers(
		actorId: number,
		targetIds: number[],
		isAdmin: boolean,
	): Promise<User[]> {
		const actor = await this.userRepository.findOneById(actorId);
		if (!actor?.isAdmin) throw new ForbiddenException('Admin access required');

		return await this.userRepository.setUsersAdmin(targetIds, isAdmin);
	}

	async setBlockedForUsers(
		actorId: number,
		targetIds: number[],
		blocked: boolean,
	): Promise<User[]> {
		const actor = await this.userRepository.findOneById(actorId);
		if (!actor?.isAdmin) throw new ForbiddenException('Admin access required');

		return await this.userRepository.setUsersBlocked(targetIds, blocked);
	}
}
