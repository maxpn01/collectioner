import { ConflictException, Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async signUp(email: string, password: string) {
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = password;
    const user = await this.userRepository.createUser(email, passwordHash);

    return {
      id: user.id,
      email: user.email,
    };
  }
}
