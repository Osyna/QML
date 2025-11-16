import {
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { QuestionType, Difficulty, CheckType } from '../../common/enums';

/**
 * DTO for querying Questions with filters and pagination
 */
export class QueryQuestionDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by question type',
    enum: QuestionType,
    example: QuestionType.MultipleChoice,
  })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({
    description: 'Filter by difficulty level',
    enum: Difficulty,
    example: Difficulty.Medium,
  })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({
    description: 'Filter by category',
    example: 'Mathematics',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by check type',
    enum: CheckType,
    example: CheckType.AI,
  })
  @IsOptional()
  @IsEnum(CheckType)
  checkType?: CheckType;

  @ApiPropertyOptional({
    description: 'Search query for question text and tags (full-text search)',
    example: 'algorithm',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by public status',
    type: Boolean,
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by creator user ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  createdById?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum points',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPoints?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum points',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPoints?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum time limit (seconds)',
    example: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minTimeLimit?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum time limit (seconds)',
    example: 300,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxTimeLimit?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum average score',
    minimum: 0,
    maximum: 1,
    example: 0.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  minAverageScore?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum average score',
    minimum: 0,
    maximum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  maxAverageScore?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum total attempts',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minTotalAttempts?: number;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated or array)',
    type: [String],
    example: ['math', 'algebra'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((tag) => tag.trim());
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Filter by version',
    example: '1.0',
  })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({
    description: 'Filter questions created after this date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @Type(() => Date)
  createdAfter?: Date;

  @ApiPropertyOptional({
    description: 'Filter questions created before this date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @Type(() => Date)
  createdBefore?: Date;

  @ApiPropertyOptional({
    description: 'Filter questions updated after this date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @Type(() => Date)
  updatedAfter?: Date;

  @ApiPropertyOptional({
    description: 'Filter questions updated before this date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @Type(() => Date)
  updatedBefore?: Date;

  @ApiPropertyOptional({
    description: 'Include questions with multimedia only',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  hasMultimedia?: boolean;

  @ApiPropertyOptional({
    description: 'Include questions with hints only',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  hasHints?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by question pool ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  poolId?: number;

  @ApiPropertyOptional({
    description: 'Filter by questionnaire ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionnaireId?: number;
}
