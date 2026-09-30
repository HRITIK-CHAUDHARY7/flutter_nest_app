import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

@Entity('photo_records')
@Index(['userId', 'createdAt'])
export class PhotoRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ length: 255 })
  filename: string;

  @Column({ length: 100 })
  mimeType: string;

  @CreateDateColumn()
  createdAt: Date;
}