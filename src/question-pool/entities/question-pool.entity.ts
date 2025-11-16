import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Question } from '../../question/entities/question.entity';
import { Difficulty } from '../../common/enums';

@Entity('question_pools')
@Index(['category'])
@Index(['difficulty'])
export class QuestionPool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({
    type: 'simple-enum',
    enum: Difficulty,
    nullable: true,
  })
  difficulty: Difficulty;

  @Column({ nullable: true })
  category: string;

  @Column({ default: '1.0' })
  version: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPublic: boolean;

  // Relations
  @ManyToOne(() => User, (user) => user.createdPools, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ nullable: true })
  created_by_id: number;

  @ManyToMany(() => Question, (question) => question.pools)
  @JoinTable({
    name: 'question_pool_questions',
    joinColumn: { name: 'pool_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'question_id', referencedColumnName: 'id' },
  })
  questions: Question[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
