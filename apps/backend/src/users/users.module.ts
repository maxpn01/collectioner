import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { UserRepository } from './user.repository';

@Module({
	imports: [TypeOrmModule.forFeature([User])],
	providers: [UsersService, UserRepository],
	controllers: [UsersController],
	exports: [UserRepository],
})
export class UsersModule {}
