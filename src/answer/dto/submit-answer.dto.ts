import {
  IsInt,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for submitting an answer to a question within a questionnaire attempt
 * Supports multiple answer types: string, number, array (for multiple choice), object (for complex questions)
 */
export class SubmitAnswerDto {
  @ApiProperty({
    description: 'The ID of the questionnaire attempt',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  attemptId: number;

  @ApiProperty({
    description: 'The ID of the question being answered',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionId: number;

  @ApiProperty({
    description: 'The user\'s answer (can be string, number, array, or object depending on question type)',
    example: 'Paris',
    oneOf: [
      { type: 'string', example: 'Paris' },
      { type: 'number', example: 42 },
      { type: 'array', items: { type: 'string' }, example: ['A', 'C'] },
      { type: 'object', example: { selectedOptions: ['A', 'B'], textInput: 'Additional answer' } },
    ],
  })
  @IsNotEmpty()
  userAnswer: string | number | string[] | Record<string, any>;

  @ApiPropertyOptional({
    description: 'Array of hint IDs that were used while answering this question',
    type: [String],
    example: ['hint-1', 'hint-2'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hintsUsed?: string[];

  @ApiPropertyOptional({
    description: 'Time spent on this question in seconds',
    example: 45,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timeSpent?: number;

  @ApiPropertyOptional({
    description: 'Flag to mark this submission for manual review',
    example: false,
  })
  @IsOptional()
  flaggedForReview?: boolean;
}

/**
 * DTO for bulk submitting multiple answers at once
 */
export class BulkSubmitAnswersDto {
  @ApiProperty({
    description: 'The ID of the questionnaire attempt',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  attemptId: number;

  @ApiProperty({
    description: 'Array of answer submissions',
    type: [SubmitAnswerDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  submissions: Omit<SubmitAnswerDto, 'attemptId'>[];
}
