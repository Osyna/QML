import {
  IsInt,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Metadata to be captured when starting a questionnaire attempt
 */
class AttemptMetadataDto {
  @ApiPropertyOptional({
    description: 'IP address of the user',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent string from the browser',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Device type (desktop, mobile, tablet)',
    example: 'desktop',
  })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({
    description: 'Starting question index (for resuming attempts)',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  currentQuestionIndex?: number;

  @ApiPropertyOptional({
    description: 'Array of question IDs representing the path taken through the questionnaire',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsOptional()
  pathTaken?: number[];
}

/**
 * DTO for starting a new questionnaire attempt
 */
export class StartQuestionnaireDto {
  @ApiProperty({
    description: 'The ID of the questionnaire to attempt',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionnaireId: number;

  @ApiPropertyOptional({
    description: 'Metadata about the attempt (IP address, user agent, device type, etc.)',
    type: () => AttemptMetadataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AttemptMetadataDto)
  @IsObject()
  metadata?: AttemptMetadataDto;
}
