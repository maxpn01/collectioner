import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class UserRepository {
	constructor(
		@InjectRepository(User)
		private readonly repo: Repository<User>,
	) {}

	async findOneById(id: string): Promise<User | null> {
		return this.repo.findOne({ where: { id } });
	}

	async findAllByIds(ids: string[]): Promise<User[]> {
		const uniqueIds = [...new Set(ids)];
		return this.repo.find({ where: { id: In(uniqueIds) } });
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

	async deleteUsers(ids: string[]): Promise<void> {
		await this.repo.delete(ids);
	}

	async getUsersPage(
		size: number,
		pageN: number,
	): Promise<{ page: User[]; lastPage: number }> {
		const offset = size * (pageN - 1);

		const [page, total] = await this.repo.findAndCount({
			skip: offset,
			take: size,
			order: { createdAt: 'DESC' },
		});

		return {
			page,
			lastPage: Math.ceil(total / size),
		};
	}

	async setUsersAdmin(ids: string[], isAdmin: boolean): Promise<User[]> {
		const uniqueIds = [...new Set(ids)];
		const users = await this.findAllByIds(uniqueIds);

		if (users.length !== uniqueIds.length)
			throw new NotFoundException('User not found');

		await this.repo.update({ id: In(uniqueIds) }, { isAdmin });

		return users.map((user) => ({
			...user,
			isAdmin,
		}));
	}

	async setUsersBlocked(ids: string[], blocked: boolean): Promise<User[]> {
		const uniqueIds = [...new Set(ids)];
		const users = await this.findAllByIds(uniqueIds);

		if (users.length !== uniqueIds.length)
			throw new NotFoundException('User not found');

		await this.repo.update({ id: In(uniqueIds) }, { blocked });

		return users.map((user) => ({
			...user,
			blocked,
		}));
	}

	async updateRefreshTokenHash(
		userId: string,
		refreshTokenHash: string | null,
	) {
		await this.repo.update(userId, { refreshTokenHash });
	}
}
