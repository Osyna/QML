import { ValidationResult } from '../entities/answer.entity';

export class AnswerResponseDto {
  id: number;
  questionId: number;
  questionnaireId?: number;
  userId?: string;
  userAnswer: string;
  validationResult?: ValidationResult;
  usedHints?: number[];
  timeSpent?: number;
  submittedAt: Date;
}
