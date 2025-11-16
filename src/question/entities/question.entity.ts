import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { QuestionPool } from '../../question-pool/entities/question-pool.entity';
import { Questionnaire } from '../../questionnaire/entities/questionnaire.entity';
import { QuestionVersion } from '../../versioning/entities/question-version.entity';
import { AnswerSubmission } from '../../answer/entities/answer-submission.entity';
import { QuestionType, Difficulty, CheckType, AICheckType } from '../../common/enums';

export interface QuestionContent {
  text: string;
  multimedia?: string;
  answers?: Answer[];
  hints?: Hint[];
  feedback?: Feedback;
  tags?: string[];
}

export interface Answer {
  id?: string;
  answerText: string;
  isCorrect?: boolean;
  points?: number;
  explanation?: string;
  order?: number;
  imageUrl?: string;
}

export interface Hint {
  id?: string;
  hintText: string;
  cost: number;
  order?: number;
}

export interface Feedback {
  correct?: string;
  incorrect?: string;
  partial?: string;
}

export interface AICheckConfig {
  type: AICheckType;
  sensitivity?: number; // 0-1
  prompt?: string;
  threshold?: number;
}

export interface KeywordsCheckConfig {
  keywords: string[];
  caseSensitive?: boolean;
  partial?: boolean;
  minMatches?: number;
}

@Entity('questions')
@Index(['category'])
@Index(['difficulty'])
@Index(['type'])
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'simple-enum',
    enum: QuestionType,
  })
  type: QuestionType;

  @Column({ nullable: true })
  minChar: number;

  @Column({ nullable: true })
  maxChar: number;

  @Column({
    type: 'simple-enum',
    enum: CheckType,
    default: CheckType.Exact,
  })
  checkType: CheckType;

  @Column({ type: 'json', nullable: true })
  checkConfig: AICheckConfig | KeywordsCheckConfig;

  @Column({ type: 'real', nullable: true, default: 1 })
  points: number;

  @Column({
    type: 'simple-enum',
    enum: Difficulty,
    nullable: true,
  })
  difficulty: Difficulty;

  @Index()
  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  timeLimit: number;

  @Column({ default: '1.0' })
  version: string;

  @Column({ type: 'json' })
  content: QuestionContent;

  @Column({ type: 'text', nullable: true })
  searchableContent: string; // Denormalized for full-text search

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPublic: boolean;

  // Statistics
  @Column({ default: 0 })
  totalAttempts: number;

  @Column({ default: 0 })
  correctAttempts: number;

  @Column({ type: 'real', nullable: true })
  averageScore: number;

  @Column({ type: 'real', nullable: true })
  averageTimeSpent: number;

  // Relations
  @ManyToOne(() => User, (user) => user.createdQuestions, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ nullable: true })
  created_by_id: number;

  @ManyToMany(() => QuestionPool, (pool) => pool.questions)
  pools: QuestionPool[];

  @ManyToMany(() => Questionnaire, (questionnaire) => questionnaire.questions)
  questionnaires: Questionnaire[];

  @OneToMany(() => QuestionVersion, (version) => version.question)
  versions: QuestionVersion[];

  @OneToMany(() => AnswerSubmission, (submission) => submission.question)
  submissions: AnswerSubmission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
