import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export interface ValidationResult {
  isCorrect: boolean;
  score: number;
  maxScore: number;
  percentage: number;
  feedback?: string;
  usedHints?: number[];
  hintCost?: number;
}

@Entity()
export class Answer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  questionId: number;

  @Column({ nullable: true })
  questionnaireId?: number;

  @Column({ nullable: true })
  userId?: string;

  @Column({ type: 'text' })
  userAnswer: string;

  @Column({ type: 'json', nullable: true })
  validationResult?: ValidationResult;

  @Column({ type: 'json', nullable: true })
  usedHints?: number[];

  @Column({ type: 'real', nullable: true })
  timeSpent?: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt: Date;
}
