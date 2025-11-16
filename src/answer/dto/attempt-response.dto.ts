import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  AttemptStatus,
  AttemptResult,
} from '../entities/questionnaire-attempt.entity';
import { ValidationStatus } from '../entities/answer-submission.entity';
import { AnswerValidationResultDto } from './answer-validation-result.dto';

/**
 * Metadata response DTO
 */
class AttemptMetadataResponseDto {
  @ApiPropertyOptional({
    description: 'IP address of the user',
    example: '192.168.1.1',
  })
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent string',
    example: 'Mozilla/5.0',
  })
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Device type',
    example: 'desktop',
  })
  deviceType?: string;

  @ApiPropertyOptional({
    description: 'Current question index',
    example: 5,
  })
  currentQuestionIndex?: number;

  @ApiPropertyOptional({
    description: 'Path taken through questionnaire',
    type: [Number],
    example: [1, 2, 3, 4, 5],
  })
  pathTaken?: number[];
}

/**
 * Answer submission response DTO
 */
@Exclude()
export class AnswerSubmissionResponseDto {
  @ApiProperty({
    description: 'Submission ID',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Attempt ID',
    example: 1,
  })
  @Expose()
  attempt_id: number;

  @ApiProperty({
    description: 'Question ID',
    example: 1,
  })
  @Expose()
  question_id: number;

  @ApiProperty({
    description: 'User\'s answer',
    example: 'Paris',
    oneOf: [
      { type: 'string' },
      { type: 'number' },
      { type: 'array' },
      { type: 'object' },
    ],
  })
  @Expose()
  userAnswer: any;

  @ApiProperty({
    description: 'Validation status',
    enum: ValidationStatus,
    example: ValidationStatus.Correct,
  })
  @Expose()
  validationStatus: ValidationStatus;

  @ApiPropertyOptional({
    description: 'Detailed validation result',
    type: () => AnswerValidationResultDto,
  })
  @Expose()
  @Type(() => AnswerValidationResultDto)
  validationResult?: AnswerValidationResultDto;

  @ApiPropertyOptional({
    description: 'Time spent on question (seconds)',
    example: 45,
  })
  @Expose()
  timeSpent?: number;

  @ApiPropertyOptional({
    description: 'Hints used',
    type: [String],
    example: ['hint-1', 'hint-2'],
  })
  @Expose()
  hintsUsed?: string[];

  @ApiProperty({
    description: 'Flagged for review',
    example: false,
  })
  @Expose()
  flaggedForReview: boolean;

  @ApiPropertyOptional({
    description: 'Review notes',
    example: 'Answer requires manual verification',
  })
  @Expose()
  reviewNotes?: string;

  @ApiProperty({
    description: 'Submission timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  submittedAt: Date;

  @ApiPropertyOptional({
    description: 'Validation timestamp',
    example: '2024-01-15T10:30:05.000Z',
  })
  @Expose()
  validatedAt?: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:05.000Z',
  })
  @Expose()
  updatedAt: Date;
}

/**
 * Minimal user information for attempt response
 */
@Exclude()
export class AttemptUserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'User email',
    example: 'john.doe@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  @Expose()
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  @Expose()
  lastName: string;
}

/**
 * Minimal questionnaire information for attempt response
 */
@Exclude()
export class AttemptQuestionnaireResponseDto {
  @ApiProperty({
    description: 'Questionnaire ID',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Questionnaire title',
    example: 'Introduction to Geography',
  })
  @Expose()
  title: string;

  @ApiPropertyOptional({
    description: 'Questionnaire description',
    example: 'Test your knowledge of world geography',
  })
  @Expose()
  description?: string;

  @ApiPropertyOptional({
    description: 'Passing percentage required',
    example: 70,
  })
  @Expose()
  passingPercentage?: number;
}

/**
 * Complete questionnaire attempt response DTO
 * Used for returning attempt data with all related information
 */
@Exclude()
export class AttemptResponseDto {
  @ApiProperty({
    description: 'Attempt ID',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  @Expose()
  user_id: number;

  @ApiPropertyOptional({
    description: 'User information',
    type: () => AttemptUserResponseDto,
  })
  @Expose()
  @Type(() => AttemptUserResponseDto)
  user?: AttemptUserResponseDto;

  @ApiProperty({
    description: 'Questionnaire ID',
    example: 1,
  })
  @Expose()
  questionnaire_id: number;

  @ApiPropertyOptional({
    description: 'Questionnaire information',
    type: () => AttemptQuestionnaireResponseDto,
  })
  @Expose()
  @Type(() => AttemptQuestionnaireResponseDto)
  questionnaire?: AttemptQuestionnaireResponseDto;

  @ApiProperty({
    description: 'Attempt status',
    enum: AttemptStatus,
    example: AttemptStatus.Completed,
  })
  @Expose()
  status: AttemptStatus;

  @ApiProperty({
    description: 'Attempt result',
    enum: AttemptResult,
    example: AttemptResult.Pass,
  })
  @Expose()
  result: AttemptResult;

  @ApiPropertyOptional({
    description: 'Total score achieved',
    example: 85,
  })
  @Expose()
  score?: number;

  @ApiPropertyOptional({
    description: 'Percentage score',
    example: 85.5,
  })
  @Expose()
  percentage?: number;

  @ApiPropertyOptional({
    description: 'Total time spent (seconds)',
    example: 1800,
  })
  @Expose()
  timeSpent?: number;

  @ApiPropertyOptional({
    description: 'Attempt metadata',
    type: () => AttemptMetadataResponseDto,
  })
  @Expose()
  @Type(() => AttemptMetadataResponseDto)
  metadata?: AttemptMetadataResponseDto;

  @ApiPropertyOptional({
    description: 'User feedback',
    example: 'Great questionnaire, very informative!',
  })
  @Expose()
  feedback?: string;

  @ApiPropertyOptional({
    description: 'AI-generated feedback',
    example: 'You performed well on this questionnaire. Consider reviewing the topics where you scored lower.',
  })
  @Expose()
  aiGeneratedFeedback?: string;

  @ApiPropertyOptional({
    description: 'Answer submissions',
    type: [AnswerSubmissionResponseDto],
    isArray: true,
  })
  @Expose()
  @Type(() => AnswerSubmissionResponseDto)
  submissions?: AnswerSubmissionResponseDto[];

  @ApiProperty({
    description: 'Attempt start timestamp',
    example: '2024-01-15T10:00:00.000Z',
  })
  @Expose()
  startedAt: Date;

  @ApiPropertyOptional({
    description: 'Attempt completion timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  completedAt?: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}

/**
 * Summary statistics for an attempt
 */
@Exclude()
export class AttemptSummaryDto {
  @ApiProperty({
    description: 'Attempt ID',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Attempt status',
    enum: AttemptStatus,
    example: AttemptStatus.Completed,
  })
  @Expose()
  status: AttemptStatus;

  @ApiProperty({
    description: 'Attempt result',
    enum: AttemptResult,
    example: AttemptResult.Pass,
  })
  @Expose()
  result: AttemptResult;

  @ApiPropertyOptional({
    description: 'Score percentage',
    example: 85.5,
  })
  @Expose()
  percentage?: number;

  @ApiProperty({
    description: 'Total questions',
    example: 10,
  })
  @Expose()
  totalQuestions: number;

  @ApiProperty({
    description: 'Answered questions',
    example: 10,
  })
  @Expose()
  answeredQuestions: number;

  @ApiProperty({
    description: 'Correct answers',
    example: 8,
  })
  @Expose()
  correctAnswers: number;

  @ApiProperty({
    description: 'Incorrect answers',
    example: 2,
  })
  @Expose()
  incorrectAnswers: number;

  @ApiProperty({
    description: 'Partially correct answers',
    example: 0,
  })
  @Expose()
  partialAnswers: number;

  @ApiPropertyOptional({
    description: 'Total time spent (seconds)',
    example: 1800,
  })
  @Expose()
  timeSpent?: number;

  @ApiProperty({
    description: 'Attempt start timestamp',
    example: '2024-01-15T10:00:00.000Z',
  })
  @Expose()
  startedAt: Date;

  @ApiPropertyOptional({
    description: 'Attempt completion timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  completedAt?: Date;
}
