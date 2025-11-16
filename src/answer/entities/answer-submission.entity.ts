import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Question } from '../../question/entities/question.entity';
import { QuestionnaireAttempt } from './questionnaire-attempt.entity';

export enum ValidationStatus {
  Correct = 'correct',
  Incorrect = 'incorrect',
  Partial = 'partial',
  Pending = 'pending', // For manual review
  NoGrading = 'no-grading', // For surveys
}

export interface ValidationResult {
  status: ValidationStatus;
  score: number;
  maxScore: number;
  explanation?: string;
  aiAnalysis?: {
    confidence: number;
    reasoning: string;
    suggestions?: string[];
  };
  keywordMatches?: string[];
  hintsUsed?: number;
  hintCostDeducted?: number;
}

@Entity('answer_submissions')
@Index(['attempt_id'])
@Index(['question_id'])
export class AnswerSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => QuestionnaireAttempt, (attempt) => attempt.submissions)
  @JoinColumn({ name: 'attempt_id' })
  attempt: QuestionnaireAttempt;

  @Column()
  attempt_id: number;

  @ManyToOne(() => Question, (question) => question.submissions)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column()
  question_id: number;

  @Column({ type: 'json' })
  userAnswer: any; // Flexible to support different question types

  @Column({
    type: 'simple-enum',
    enum: ValidationStatus,
    default: ValidationStatus.Pending,
  })
  validationStatus: ValidationStatus;

  @Column({ type: 'json', nullable: true })
  validationResult: ValidationResult;

  @Column({ nullable: true })
  timeSpent: number; // in seconds

  @Column({ type: 'simple-array', nullable: true })
  hintsUsed: string[]; // Array of hint IDs

  @Column({ default: false })
  flaggedForReview: boolean;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @CreateDateColumn()
  submittedAt: Date;

  @Column({ nullable: true })
  validatedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
