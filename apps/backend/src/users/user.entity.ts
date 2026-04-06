import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ unique: true })
	email: string;

	@Column({ type: 'text', unique: true, nullable: true })
	username: string;

	@Column()
	passwordHash: string;

	@Column({ type: 'text', nullable: true })
	refreshTokenHash: string | null;

	@Column({ type: 'text', nullable: true })
	fullname: string;

	@Column({ default: false })
	blocked: boolean;

	@Column({ default: false })
	isAdmin: boolean;
}
