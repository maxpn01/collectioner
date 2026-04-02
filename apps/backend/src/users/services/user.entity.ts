import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ nullable: true })
  fullname: string;

  @Column({ default: false })
  blocked: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  @Column()
  passwordHash: string;
}
