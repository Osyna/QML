import {
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  IsObject,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '../../common/enums/question-type.enum';
import { CheckMethod, AICheckType } from '../../common/enums/check-type.enum';
import { Difficulty } from '../../common/enums/difficulty.enum';
import { QuestionContent, CheckConfig } from '../entities/question.entity';

export class CreateQuestionDto {
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minChar?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxChar?: number;

  @IsOptional()
  @IsObject()
  check?: CheckConfig;

  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeLimit?: number;

  @IsOptional()
  @IsString()
  version?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  content: QuestionContent;
}
