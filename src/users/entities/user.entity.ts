import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../common/enums';
import { QuestionnaireAttempt } from '../../answer/entities/questionnaire-attempt.entity';
import { Question } from '../../question/entities/question.entity';
import { Questionnaire } from '../../questionnaire/entities/questionnaire.entity';
import { QuestionPool } from '../../question-pool/entities/question-pool.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'simple-enum',
    enum: Role,
    default: Role.STUDENT,
  })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'json', nullable: true })
  preferences: {
    language?: string;
    timezone?: string;
    notifications?: boolean;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLoginAt: Date;

  // Relations
  @OneToMany(() => Question, (question) => question.createdBy)
  createdQuestions: Question[];

  @OneToMany(() => QuestionPool, (pool) => pool.createdBy)
  createdPools: QuestionPool[];

  @OneToMany(() => Questionnaire, (questionnaire) => questionnaire.createdBy)
  createdQuestionnaires: Questionnaire[];

  @OneToMany(() => QuestionnaireAttempt, (attempt) => attempt.user)
  attempts: QuestionnaireAttempt[];
}
