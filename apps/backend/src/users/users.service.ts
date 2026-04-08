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

	async deleteUserById(actorId: number, targetId: number): Promise<void> {
		const user = await this.userRepository.findOneById(actorId);
		if (actorId !== targetId && !user?.isAdmin)
			throw new ForbiddenException('Admin access required');

		const target = await this.userRepository.findOneById(targetId);
		if (!target) throw new NotFoundException('Target user not found');

		await this.userRepository.deleteUser(targetId);
	}

	async setAdmin(
		actorId: number,
		targetId: number,
		isAdmin: boolean,
	): Promise<User> {
		const actor = await this.userRepository.findOneById(actorId);
		if (!actor?.isAdmin) throw new ForbiddenException('Admin access required');

		const target = await this.userRepository.findOneById(targetId);
		if (!target) throw new NotFoundException('Target user not found');

		return await this.userRepository.setUserAdmin(targetId, isAdmin);
	}

	async setBlocked(
		actorId: number,
		targetId: number,
		blocked: boolean,
	): Promise<User> {
		const actor = await this.userRepository.findOneById(actorId);
		if (!actor?.isAdmin) throw new ForbiddenException('Admin access required');

		const target = await this.userRepository.findOneById(targetId);
		if (!target) throw new NotFoundException('Target user not found');

		return await this.userRepository.setUserBlocked(targetId, blocked);
	}
}
