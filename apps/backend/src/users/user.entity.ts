import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ unique: true })
	email!: string;

	@Column({ type: 'text', unique: true })
	username!: string;

	@Column()
	passwordHash!: string;

	@Column({ type: 'text', nullable: true })
	refreshTokenHash!: string | null;

	@Column({ type: 'text', nullable: true })
	fullname!: string | null;

	@Column({ default: false })
	blocked!: boolean;

	@Column({ default: false })
	isAdmin!: boolean;

	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ type: 'timestamptz' })
	updatedAt!: Date;
}
