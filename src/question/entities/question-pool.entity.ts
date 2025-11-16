import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Difficulty } from '../../common/enums/difficulty.enum';

@Entity()
export class QuestionPool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @Column({ type: 'json', nullable: true })
  pool: number[];

  @Column({ nullable: true })
  version?: string;

  @Column({
    type: 'varchar',
    enum: Difficulty,
    nullable: true,
  })
  difficulty?: Difficulty;

  @Column({ nullable: true })
  category?: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
