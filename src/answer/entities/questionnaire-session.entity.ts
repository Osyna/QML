import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export interface SessionQuestion {
  questionId: number;
  answerId?: number;
  answered: boolean;
  score?: number;
  timeSpent?: number;
}

@Entity()
export class QuestionnaireSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  questionnaireId: number;

  @Column({ nullable: true })
  userId?: string;

  @Column({ type: 'json' })
  questions: SessionQuestion[];

  @Column({ nullable: true })
  currentQuestionIndex?: number;

  @Column({ type: 'real', default: 0 })
  totalScore: number;

  @Column({ type: 'real', default: 0 })
  maxScore: number;

  @Column({ type: 'real', nullable: true })
  totalTimeSpent?: number;

  @Column({ default: false })
  completed: boolean;

  @Column({ nullable: true })
  passed?: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt?: Date;
}
