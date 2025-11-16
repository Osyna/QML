import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { QuestionnaireType, PathNodeType } from '../../common/enums/questionnaire-type.enum';
import { Difficulty } from '../../common/enums/difficulty.enum';

export interface PathNode {
  type: PathNodeType;
  question?: number;
  answers?: { [key: string]: PathNode };
  label?: string;
  gotoLabel?: string;
}

@Entity()
export class Questionnaire {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @Column({
    type: 'varchar',
    enum: QuestionnaireType,
  })
  type: QuestionnaireType;

  @Column({ nullable: true })
  maxQuestions?: number;

  @Column({ type: 'json', nullable: true })
  pool?: PathNode[];

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

  @Column({ nullable: true })
  timeLimit?: number;

  @Column({ type: 'real', nullable: true })
  points?: number;

  @Column({ type: 'real', nullable: true })
  passPercentage?: number;

  @Column({ type: 'real', nullable: true })
  passPoints?: number;

  @Column({ type: 'text', nullable: true })
  passText?: string;

  @Column({ type: 'text', nullable: true })
  failText?: string;

  @Column({ nullable: true, default: true })
  showResult?: boolean;

  @Column({ nullable: true, default: true })
  showFeedback?: boolean;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @Column({ nullable: true, default: false })
  showDifficulty?: boolean;

  @Column({ nullable: true, default: false })
  showCategory?: boolean;

  @Column({ nullable: true, default: false })
  showTags?: boolean;

  @Column({ nullable: true, default: true })
  showTimeLimit?: boolean;

  @Column({ nullable: true, default: false })
  showTime?: boolean;

  @Column({ nullable: true, default: true })
  showPoints?: boolean;

  @Column({ nullable: true, default: true })
  showScore?: boolean;

  @Column({ nullable: true, default: false })
  showPassPercentage?: boolean;

  @Column({ nullable: true, default: false })
  showPassPoints?: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
