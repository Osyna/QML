import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Question } from '../../question/entities/question.entity';
import { QuestionnaireAttempt } from '../../answer/entities/questionnaire-attempt.entity';
import { Difficulty, QuestionnaireType } from '../../common/enums';

export interface QuestionnaireSettings {
  showResult?: boolean;
  showFeedback?: boolean;
  showDifficulty?: boolean;
  showCategory?: boolean;
  showTags?: boolean;
  showTimeLimit?: boolean;
  showTime?: boolean;
  showPoints?: boolean;
  showScore?: boolean;
  showPassPercentage?: boolean;
  showPassPoints?: boolean;
  randomizeQuestions?: boolean;
  randomizeAnswers?: boolean;
  allowReview?: boolean;
  allowRetake?: boolean;
  maxRetakes?: number;
}

export interface PathLogicStructure {
  type: 'path' | 'question' | 'break' | 'end' | 'goto';
  questionId?: number;
  answers?: {
    [answerId: string]: PathLogicStructure;
  };
  label?: string;
  goto?: string;
}

@Entity('questionnaires')
@Index(['category'])
@Index(['difficulty'])
@Index(['type'])
export class Questionnaire {
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
    enum: QuestionnaireType,
    default: QuestionnaireType.QuestionsAnswers,
  })
  type: QuestionnaireType;

  @Column({ nullable: true })
  maxQuestions: number;

  @Column({ default: '1.0' })
  version: string;

  @Column({
    type: 'simple-enum',
    enum: Difficulty,
    nullable: true,
  })
  difficulty: Difficulty;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  timeLimit: number;

  @Column({ type: 'real', nullable: true })
  points: number;

  @Column({ type: 'real', nullable: true })
  passPercentage: number;

  @Column({ type: 'real', nullable: true })
  passPoints: number;

  @Column({ type: 'text', nullable: true })
  passText: string;

  @Column({ type: 'text', nullable: true })
  failText: string;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'json', nullable: true })
  settings: QuestionnaireSettings;

  @Column({ type: 'json', nullable: true })
  pathLogic: PathLogicStructure[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.createdQuestionnaires, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ nullable: true })
  created_by_id: number;

  @ManyToMany(() => Question, (question) => question.questionnaires)
  @JoinTable({
    name: 'questionnaire_questions',
    joinColumn: { name: 'questionnaire_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'question_id', referencedColumnName: 'id' },
  })
  questions: Question[];

  @OneToMany(() => QuestionnaireAttempt, (attempt) => attempt.questionnaire)
  attempts: QuestionnaireAttempt[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
