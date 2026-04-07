import { Injectable, NotFoundException } from '@nestjs/common';
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

	async deleteUserById(id: number): Promise<void> {
		await this.userRepository.deleteUser(id);
	}
}
