import { ValidationResult } from '../entities/answer.entity';

export interface QuestionResult {
  questionId: number;
  questionText: string;
  userAnswer: string;
  validationResult: ValidationResult;
  correctAnswer?: string;
}

export class SessionResultDto {
  sessionId: number;
  questionnaireId: number;
  questionnaireName: string;
  userId?: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  questionsAnswered: number;
  totalQuestions: number;
  totalTimeSpent?: number;
  results: QuestionResult[];
  passText?: string;
  failText?: string;
  startedAt: Date;
  completedAt: Date;
}
