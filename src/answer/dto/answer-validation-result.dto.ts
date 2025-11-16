import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidationStatus } from '../entities/answer-submission.entity';

/**
 * AI Analysis information for answer validation
 */
class AIAnalysisDto {
  @ApiProperty({
    description: 'AI confidence score for the validation (0-1)',
    example: 0.95,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiProperty({
    description: 'AI reasoning for the validation result',
    example: 'The answer correctly identifies the capital city and provides additional context.',
  })
  @IsString()
  reasoning: string;

  @ApiPropertyOptional({
    description: 'AI-generated suggestions for improvement',
    type: [String],
    example: [
      'Consider adding more details about the historical context',
      'The answer could benefit from citing sources',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suggestions?: string[];
}

/**
 * DTO representing the validation result for a submitted answer
 * Contains scoring, status, explanations, and AI analysis
 */
export class AnswerValidationResultDto {
  @ApiProperty({
    description: 'Validation status of the answer',
    enum: ValidationStatus,
    example: ValidationStatus.Correct,
  })
  @IsEnum(ValidationStatus)
  status: ValidationStatus;

  @ApiProperty({
    description: 'Score achieved for this answer',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  score: number;

  @ApiProperty({
    description: 'Maximum possible score for this answer',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  maxScore: number;

  @ApiPropertyOptional({
    description: 'Explanation of the validation result',
    example: 'Correct! Paris is indeed the capital of France.',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    description: 'AI analysis of the answer (if AI validation was used)',
    type: () => AIAnalysisDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AIAnalysisDto)
  @IsObject()
  aiAnalysis?: AIAnalysisDto;

  @ApiPropertyOptional({
    description: 'Keywords that matched in the answer (for keyword-based validation)',
    type: [String],
    example: ['Paris', 'capital', 'France'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywordMatches?: string[];

  @ApiPropertyOptional({
    description: 'Number of hints used for this question',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hintsUsed?: number;

  @ApiPropertyOptional({
    description: 'Score deducted due to hint usage',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hintCostDeducted?: number;
}

/**
 * DTO for manually providing or overriding a validation result
 */
export class ManualValidationDto {
  @ApiProperty({
    description: 'Validation status to set',
    enum: ValidationStatus,
    example: ValidationStatus.Correct,
  })
  @IsEnum(ValidationStatus)
  status: ValidationStatus;

  @ApiProperty({
    description: 'Score to assign',
    example: 10,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  score: number;

  @ApiProperty({
    description: 'Maximum possible score',
    example: 10,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxScore: number;

  @ApiPropertyOptional({
    description: 'Explanation for the manual validation',
    example: 'Answer demonstrates deep understanding despite minor formatting issues.',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Review notes for internal tracking',
    example: 'Reviewed by instructor. Original AI validation was too strict.',
  })
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
