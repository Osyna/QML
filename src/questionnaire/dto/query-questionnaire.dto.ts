import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDate,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Difficulty, QuestionnaireType } from '../../common/enums';

export class QueryQuestionnaireDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by questionnaire name (case-insensitive partial match)',
    example: 'JavaScript',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category',
    example: 'Programming Languages',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by difficulty level',
    enum: Difficulty,
    example: Difficulty.Medium,
  })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({
    description: 'Filter by questionnaire type',
    enum: QuestionnaireType,
    example: QuestionnaireType.QuestionsAnswers,
  })
  @IsOptional()
  @IsEnum(QuestionnaireType)
  type?: QuestionnaireType;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated)',
    example: 'javascript,frontend',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    type: Boolean,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by public status',
    type: Boolean,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by creator user ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  createdById?: number;

  @ApiPropertyOptional({
    description: 'Filter by version',
    example: '1.0',
  })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({
    description: 'Filter questionnaires with minimum number of questions',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minQuestions?: number;

  @ApiPropertyOptional({
    description: 'Filter questionnaires with maximum number of questions',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxQuestions?: number;

  @ApiPropertyOptional({
    description: 'Filter questionnaires available from this date',
    example: '2025-01-01T00:00:00Z',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  availableFrom?: Date;

  @ApiPropertyOptional({
    description: 'Filter questionnaires available until this date',
    example: '2025-12-31T23:59:59Z',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  availableUntil?: Date;

  @ApiPropertyOptional({
    description: 'Filter questionnaires currently available (between start and end dates)',
    type: Boolean,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  currentlyAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by minimum time limit (in minutes)',
    example: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minTimeLimit?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum time limit (in minutes)',
    example: 120,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxTimeLimit?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum points',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPoints?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum points',
    example: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPoints?: number;
}
