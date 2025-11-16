import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Question } from '../../question/entities/question.entity';
import { User } from '../../users/entities/user.entity';

@Entity('question_versions')
@Index(['question_id', 'version'])
export class QuestionVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Question, (question) => question.versions)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column()
  question_id: number;

  @Column()
  version: string;

  @Column({ type: 'json' })
  snapshot: any; // Full question snapshot at this version

  @Column({ type: 'text', nullable: true })
  changeDescription: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ nullable: true })
  created_by_id: number;

  @CreateDateColumn()
  createdAt: Date;
}
