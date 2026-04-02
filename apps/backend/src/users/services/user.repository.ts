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

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  createUser(email: string, passwordHash: string) {
    const user = this.repo.create({
      email,
      passwordHash,
      blocked: false,
      isAdmin: false,
    });

    return this.repo.save(user);
  }
}
