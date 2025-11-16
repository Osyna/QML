import { IsNumber, IsString, IsOptional, IsArray } from 'class-validator';

export class SubmitAnswerDto {
  @IsNumber()
  questionId: number;

  @IsOptional()
  @IsNumber()
  questionnaireId?: number;

  @IsOptional()
  @IsString()
  userId?: string;

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
