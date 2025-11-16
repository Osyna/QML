import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Questionnaire } from '../../questionnaire/entities/questionnaire.entity';
import { AnswerSubmission } from './answer-submission.entity';

export enum AttemptStatus {
  InProgress = 'in-progress',
  Completed = 'completed',
  Abandoned = 'abandoned',
  TimedOut = 'timed-out',
}

export enum AttemptResult {
  Pass = 'pass',
  Fail = 'fail',
  Pending = 'pending',
  NoGrading = 'no-grading', // For surveys
}

@Entity('questionnaire_attempts')
@Index(['user_id', 'questionnaire_id'])
@Index(['status'])
export class QuestionnaireAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.attempts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: number;

  @ManyToOne(() => Questionnaire, (questionnaire) => questionnaire.attempts)
  @JoinColumn({ name: 'questionnaire_id' })
  questionnaire: Questionnaire;

  @Column()
  questionnaire_id: number;

  @Column({
    type: 'simple-enum',
    enum: AttemptStatus,
    default: AttemptStatus.InProgress,
  })
  status: AttemptStatus;

  @Column({
    type: 'simple-enum',
    enum: AttemptResult,
    default: AttemptResult.Pending,
  })
  result: AttemptResult;

  @Column({ type: 'real', nullable: true })
  score: number;

  @Column({ type: 'real', nullable: true })
  percentage: number;

  @Column({ nullable: true })
  timeSpent: number; // in seconds

  @Column({ type: 'json', nullable: true })
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    deviceType?: string;
    currentQuestionIndex?: number;
    pathTaken?: number[]; // Array of question IDs in order
  };

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'text', nullable: true })
  aiGeneratedFeedback: string;

  @OneToMany(() => AnswerSubmission, (submission) => submission.attempt)
  submissions: AnswerSubmission[];

  @CreateDateColumn()
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
