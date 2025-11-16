import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { QuestionType } from '../../common/enums/question-type.enum';
import { CheckMethod, AICheckType } from '../../common/enums/check-type.enum';
import { Difficulty } from '../../common/enums/difficulty.enum';

export interface Answer {
  answerText: string;
  isCorrect?: boolean;
}

export interface Hint {
  hintText: string;
  cost?: number;
}

export interface Feedback {
  correct?: string;
  incorrect?: string;
}

export interface QuestionContent {
  text: string;
  multimedia?: string;
  answers?: Answer[];
  hints?: Hint[];
  feedback?: Feedback;
  tags?: string[];
}

export interface CheckConfig {
  method: CheckMethod;
  checkType?: AICheckType;
  sensitivity?: number;
  prompt?: string;
  keywords?: string[];
}

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    enum: QuestionType,
  })
  type: QuestionType;

  @Column({ nullable: true })
  minChar?: number;

  @Column({ nullable: true })
  maxChar?: number;

  @Column({ type: 'json', nullable: true })
  check?: CheckConfig;

  @Column({ type: 'real', nullable: true })
  points?: number;

  @Column({ nullable: true, default: false })
  autoHints?: boolean;

  @Column({
    type: 'varchar',
    enum: Difficulty,
    nullable: true,
  })
  difficulty?: Difficulty;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  timeLimit?: number;

  @Column({ nullable: true })
  version?: string;

  @Column({ type: 'json' })
  content: QuestionContent;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
