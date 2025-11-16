import {
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AttemptStatus, AttemptResult } from '../entities/questionnaire-attempt.entity';
import { ValidationStatus } from '../entities/answer-submission.entity';

/**
 * DTO for querying questionnaire attempts with extensive filters and pagination
 * Supports filtering by status, result, user, questionnaire, scores, dates, and more
 */
export class QueryAttemptDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by attempt status',
    enum: AttemptStatus,
    example: AttemptStatus.Completed,
  })
  @IsOptional()
  @IsEnum(AttemptStatus)
  status?: AttemptStatus;

  @ApiPropertyOptional({
    description: 'Filter by attempt result',
    enum: AttemptResult,
    example: AttemptResult.Pass,
  })
  @IsOptional()
  @IsEnum(AttemptResult)
  result?: AttemptResult;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({
    description: 'Filter by questionnaire ID',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionnaireId?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum score',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minScore?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum score',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum percentage',
    example: 0,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minPercentage?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum percentage',
    example: 100,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercentage?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum time spent (seconds)',
    example: 60,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minTimeSpent?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum time spent (seconds)',
    example: 3600,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxTimeSpent?: number;

  @ApiPropertyOptional({
    description: 'Filter attempts started after this date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @Type(() => Date)
  startedAfter?: Date;

  @ApiPropertyOptional({
    description: 'Filter attempts started before this date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @Type(() => Date)
  startedBefore?: Date;

  @ApiPropertyOptional({
    description: 'Filter attempts completed after this date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @Type(() => Date)
  completedAfter?: Date;

  @ApiPropertyOptional({
    description: 'Filter attempts completed before this date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @Type(() => Date)
  completedBefore?: Date;

  @ApiPropertyOptional({
    description: 'Include only attempts with AI-generated feedback',
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
  hasAiFeedback?: boolean;

  @ApiPropertyOptional({
    description: 'Include only attempts with user feedback',
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
  hasUserFeedback?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by validation status of submissions',
    enum: ValidationStatus,
    example: ValidationStatus.Correct,
  })
  @IsOptional()
  @IsEnum(ValidationStatus)
  submissionValidationStatus?: ValidationStatus;

  @ApiPropertyOptional({
    description: 'Include only attempts with submissions flagged for review',
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
  hasFlaggedSubmissions?: boolean;

  @ApiPropertyOptional({
    description: 'Include related submissions in the response',
    type: Boolean,
    example: true,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  includeSubmissions?: boolean;

  @ApiPropertyOptional({
    description: 'Include related user data in the response',
    type: Boolean,
    example: true,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  includeUser?: boolean;

  @ApiPropertyOptional({
    description: 'Include related questionnaire data in the response',
    type: Boolean,
    example: true,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  includeQuestionnaire?: boolean;
}
