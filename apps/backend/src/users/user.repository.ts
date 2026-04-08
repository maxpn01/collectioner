import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserRepository {
	constructor(
		@InjectRepository(User)
		private readonly repo: Repository<User>,
	) {}

	async findOneById(id: number): Promise<User | null> {
		return this.repo.findOne({ where: { id } });
	}

	async findOneByEmail(email: string): Promise<User | null> {
		return this.repo.findOne({ where: { email } });
	}

	async findAllByEmailOrUsername(
		email: string,
		username: string,
	): Promise<User[]> {
		return this.repo.find({
			where: [{ email }, { username }],
			select: { id: true, email: true, username: true },
		});
	}

	async createUser(
		email: string,
		username: string,
		passwordHash: string,
	): Promise<User> {
		const user = this.repo.create({
			email,
			username,
			passwordHash,
		});

		return this.repo.save(user);
	}

	async deleteUser(id: number): Promise<void> {
		await this.repo.delete(id);
	}

	async setUserAdmin(id: number, isAdmin: boolean): Promise<User> {
		const user = await this.findOneById(id);

		if (!user) throw new NotFoundException('User not found');

		await this.repo.update(id, { isAdmin });

		return {
			...user,
			isAdmin,
		};
	}

	async setUserBlocked(id: number, blocked: boolean): Promise<User> {
		const user = await this.findOneById(id);

		if (!user) throw new NotFoundException('User not found');

		await this.repo.update(id, { blocked });

		return {
			...user,
			blocked,
		};
	}

	async updateRefreshTokenHash(
		userId: number,
		refreshTokenHash: string | null,
	) {
		await this.repo.update(userId, { refreshTokenHash });
	}
}
