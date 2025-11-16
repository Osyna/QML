import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Difficulty } from '../../common/enums';

export class CreateQuestionPoolDto {
  @ApiProperty({
    description: 'Name of the question pool',
    example: 'JavaScript Fundamentals Pool',
    minLength: 3,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the question pool',
    example: 'A comprehensive pool of questions covering JavaScript fundamentals',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorizing and filtering the pool',
    example: ['javascript', 'frontend', 'beginner'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Difficulty level of the question pool',
    enum: Difficulty,
    example: Difficulty.Medium,
  })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({
    description: 'Category of the question pool',
    example: 'Programming Languages',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  category?: string;

  @ApiPropertyOptional({
    description: 'Version of the question pool',
    example: '1.0',
    pattern: '^\\d+\\.\\d+(\\.\\d+)?$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+\.\d+(\.\d+)?$/, {
    message: 'Version must be in format: major.minor or major.minor.patch',
  })
  version?: string;

  @ApiPropertyOptional({
    description: 'Whether the pool is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the pool is publicly accessible',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
