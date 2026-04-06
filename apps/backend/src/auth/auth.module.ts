import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';

@Module({
	imports: [
		UsersModule,
		JwtModule.registerAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
				signOptions: {
					expiresIn: Number(
						configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? 900,
					),
				},
			}),
		}),
	],
	controllers: [AuthController],
	providers: [AuthService],
})
export class AuthModule {}
