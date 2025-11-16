import {
  IsInt,
  IsOptional,
  IsString,
  IsObject,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Final metadata to be captured when completing a questionnaire attempt
 */
class CompletionMetadataDto {
  @ApiPropertyOptional({
    description: 'Final question index reached',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  currentQuestionIndex?: number;

  @ApiPropertyOptional({
    description: 'Complete array of question IDs representing the full path taken through the questionnaire',
    type: [Number],
    example: [1, 2, 3, 4, 5],
  })
  @IsOptional()
  pathTaken?: number[];

  @ApiPropertyOptional({
    description: 'IP address at completion (to detect session changes)',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent at completion',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Device type at completion',
    example: 'desktop',
  })
  @IsOptional()
  @IsString()
  deviceType?: string;
}

/**
 * DTO for completing a questionnaire attempt
 * This triggers final scoring, validation, and feedback generation
 */
export class CompleteQuestionnaireDto {
  @ApiProperty({
    description: 'The ID of the questionnaire attempt to complete',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  attemptId: number;

  @ApiPropertyOptional({
    description: 'Total time spent on the entire questionnaire in seconds',
    example: 1800,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timeSpent?: number;

  @ApiPropertyOptional({
    description: 'Optional user feedback or comments about the questionnaire',
    example: 'The questions were clear and well-structured.',
  })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata to be captured at completion',
    type: () => CompletionMetadataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompletionMetadataDto)
  @IsObject()
  metadata?: CompletionMetadataDto;
}
