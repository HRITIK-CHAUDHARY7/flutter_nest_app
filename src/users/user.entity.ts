import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ unique: true, length: 20 })
  mobile: string;

  @Column()
  password: string;

  @Column({ length: 100 })
  profession: string;

  @Column({ nullable: true, length: 20 })
  gender: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @Column()
country: string;

@Column()
state: string;

@Column()
city: string;
}