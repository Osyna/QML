import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { QuestionnaireType } from '../../common/enums/questionnaire-type.enum';
import { Difficulty } from '../../common/enums/difficulty.enum';
import { PathNode } from '../entities/questionnaire.entity';

export class CreateQuestionnaireDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsEnum(QuestionnaireType)
  type: QuestionnaireType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxQuestions?: number;

  @IsOptional()
  @IsArray()
  pool?: PathNode[];

  @IsOptional()
  @IsString()
  version?: string;

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
  @IsNumber()
  @Min(0)
  points?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  passPoints?: number;

  @IsOptional()
  @IsString()
  passText?: string;

  @IsOptional()
  @IsString()
  failText?: string;

  @IsOptional()
  @IsBoolean()
  showResult?: boolean;

  @IsOptional()
  @IsBoolean()
  showFeedback?: boolean;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsBoolean()
  showDifficulty?: boolean;

  @IsOptional()
  @IsBoolean()
  showCategory?: boolean;

  @IsOptional()
  @IsBoolean()
  showTags?: boolean;

  @IsOptional()
  @IsBoolean()
  showTimeLimit?: boolean;

  @IsOptional()
  @IsBoolean()
  showTime?: boolean;

  @IsOptional()
  @IsBoolean()
  showPoints?: boolean;

  @IsOptional()
  @IsBoolean()
  showScore?: boolean;

  @IsOptional()
  @IsBoolean()
  showPassPercentage?: boolean;

  @IsOptional()
  @IsBoolean()
  showPassPoints?: boolean;
}
