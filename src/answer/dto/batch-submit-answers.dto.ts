import { IsNumber, IsArray, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerSubmission {
  @IsNumber()
  questionId: number;

  @IsString()
  userAnswer: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  usedHints?: number[];

  @IsOptional()
  @IsNumber()
  timeSpent?: number;
}

export class BatchSubmitAnswersDto {
  @IsNumber()
  sessionId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerSubmission)
  answers: AnswerSubmission[];
}
