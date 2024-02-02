import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column({ nullable: true })
  minChar: number;

  @Column({ nullable: true })
  maxChar: number;

  @Column()
  checkText: string;

  @Column({ type: 'real', nullable: true })
  points: number;

  @Column({ nullable: true })
  difficulty: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  timeLimit: number;

  @Column({ nullable: true })
  version: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  // If you have multimedia URLs or other related fields, you can add them here
  // Example:
  // @Column({ nullable: true })
  // multimediaUrl: string;

  // If you have an answers array or other complex structures, you might need to use
  // a TypeORM relation or store it as a JSON string
  // Example:
  // @Column({ type: 'json', nullable: true })
  // answers: any[];
}


@Entity()
export class QuestionPool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  tags: string;

  // pool is a list of Question IDs
  @Column({ type: 'json', nullable: true })
  pool: number[];

  @Column({ nullable: true })
  version: string;

  @Column({ nullable: true })
  difficulty: string;

  @Column({ nullable: true })
  category: string;
}

@Entity()
export class Questionnaire {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  tags: string;

  // pool is a list of Question IDs
  @Column({ type: 'json', nullable: true })
  pool: number[];

  @Column({ nullable: true })
  version: string;

  @Column({ nullable: true })
  difficulty: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  timeLimit: number;

  @Column({ nullable: true })
  points: number;

  @Column({ nullable: true })
  passPercentage: number;

  @Column({ nullable: true })
  passPoints: number;

  @Column({ nullable: true })
  passText: string;

  @Column({ nullable: true })
  failText: string;

  @Column({ nullable: true })
  showResult: boolean;

  @Column({ nullable: true })
  showFeedback: boolean;

  @Column({ nullable: true })
  showCorrectAnswers: boolean;

  @Column({ nullable: true })
  showExplanation: boolean;

  @Column({ nullable: true })
  showDifficulty: boolean;

  @Column({ nullable: true })
  showCategory: boolean;

  @Column({ nullable: true })
  showTags: boolean;

  @Column({ nullable: true })
  showTimeLimit: boolean;

  @Column({ nullable: true })
  showPoints: boolean;

  @Column({ nullable: true })
  showPassPercentage: boolean;

  @Column({ nullable: true })
  showPassPoints: boolean;
}