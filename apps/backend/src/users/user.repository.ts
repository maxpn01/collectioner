import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserRepository {
	constructor(
		@InjectRepository(User)
		private readonly repo: Repository<User>,
	) {}

	findOneById(id: number) {
		return this.repo.findOne({ where: { id } });
	}

	findOneByEmail(email: string) {
		return this.repo.findOne({ where: { email } });
	}

	findAllByEmailOrUsername(email: string, username: string) {
		return this.repo.find({
			where: [{ email }, { username }],
			select: { id: true, email: true, username: true },
		});
	}

	createUser(email: string, username: string, passwordHash: string) {
		const user = this.repo.create({
			email,
			username,
			passwordHash,
		});

		return this.repo.save(user);
	}

	async updateRefreshTokenHash(
		userId: number,
		refreshTokenHash: string | null,
	) {
		await this.repo.update(userId, { refreshTokenHash });
	}
}
