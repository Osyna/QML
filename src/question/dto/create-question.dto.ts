import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsUrl,
  ArrayMinSize,
  IsInt,
  ValidateIf,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType, Difficulty, CheckType, AICheckType } from '../../common/enums';

/**
 * DTO for Answer within QuestionContent
 */
export class AnswerDto {
  @ApiPropertyOptional({ description: 'Answer ID (optional for new answers)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Answer text', example: 'Option A' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  answerText: string;

  @ApiPropertyOptional({ description: 'Whether this answer is correct', default: false })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiPropertyOptional({ description: 'Points awarded for this answer', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({ description: 'Explanation for this answer' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  explanation?: string;

  @ApiPropertyOptional({ description: 'Display order of the answer', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ description: 'Image URL for picture-based questions' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}

/**
 * DTO for Hint within QuestionContent
 */
export class HintDto {
  @ApiPropertyOptional({ description: 'Hint ID (optional for new hints)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Hint text', example: 'Consider the definition of...' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  hintText: string;

  @ApiProperty({ description: 'Cost in points for using this hint', example: 0.5 })
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiPropertyOptional({ description: 'Display order of the hint', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

/**
 * DTO for Feedback within QuestionContent
 */
export class FeedbackDto {
  @ApiPropertyOptional({ description: 'Feedback for correct answer' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  correct?: string;

  @ApiPropertyOptional({ description: 'Feedback for incorrect answer' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  incorrect?: string;

  @ApiPropertyOptional({ description: 'Feedback for partially correct answer' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  partial?: string;
}

/**
 * DTO for AI Check Configuration
 */
export class AICheckConfigDto {
  @ApiProperty({
    description: 'Type of AI check',
    enum: AICheckType,
    example: AICheckType.Meaning,
  })
  @IsEnum(AICheckType)
  type: AICheckType;

  @ApiPropertyOptional({
    description: 'Sensitivity level (0-1)',
    minimum: 0,
    maximum: 1,
    example: 0.8,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  sensitivity?: number;

  @ApiPropertyOptional({ description: 'Custom prompt for AI check' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prompt?: string;

  @ApiPropertyOptional({
    description: 'Threshold for passing (0-1)',
    minimum: 0,
    maximum: 1,
    example: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold?: number;
}

/**
 * DTO for Keywords Check Configuration
 */
export class KeywordsCheckConfigDto {
  @ApiProperty({
    description: 'Array of keywords to check',
    type: [String],
    example: ['algorithm', 'data structure'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  keywords: string[];

  @ApiPropertyOptional({ description: 'Whether the check is case sensitive', default: false })
  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean;

  @ApiPropertyOptional({ description: 'Whether to allow partial matches', default: false })
  @IsOptional()
  @IsBoolean()
  partial?: boolean;

  @ApiPropertyOptional({ description: 'Minimum number of keyword matches required', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minMatches?: number;
}

/**
 * DTO for QuestionContent
 */
export class QuestionContentDto {
  @ApiProperty({ description: 'Question text', example: 'What is the capital of France?' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  text: string;

  @ApiPropertyOptional({ description: 'Multimedia URL (image, video, audio)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  multimedia?: string;

  @ApiPropertyOptional({
    description: 'Array of answer options',
    type: [AnswerDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers?: AnswerDto[];

  @ApiPropertyOptional({
    description: 'Array of hints',
    type: [HintDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HintDto)
  hints?: HintDto[];

  @ApiPropertyOptional({
    description: 'Feedback for different answer scenarios',
    type: FeedbackDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FeedbackDto)
  feedback?: FeedbackDto;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    type: [String],
    example: ['math', 'algebra'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

/**
 * DTO for creating a new Question
 */
export class CreateQuestionDto {
  @ApiProperty({
    description: 'Type of the question',
    enum: QuestionType,
    example: QuestionType.MultipleChoice,
  })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiPropertyOptional({
    description: 'Minimum character limit for free-text questions',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minChar?: number;

  @ApiPropertyOptional({
    description: 'Maximum character limit for free-text questions',
    example: 500,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxChar?: number;

  @ApiProperty({
    description: 'Type of checking mechanism',
    enum: CheckType,
    example: CheckType.Exact,
    default: CheckType.Exact,
  })
  @IsEnum(CheckType)
  checkType: CheckType;

  @ApiPropertyOptional({
    description: 'Configuration for AI or Keywords check',
    oneOf: [
      { $ref: '#/components/schemas/AICheckConfigDto' },
      { $ref: '#/components/schemas/KeywordsCheckConfigDto' },
    ],
  })
  @IsOptional()
  @ValidateIf((o) => o.checkType === CheckType.AI || o.checkType === CheckType.Keywords)
  @ValidateNested()
  @Type(() => Object, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: AICheckConfigDto, name: 'ai' },
        { value: KeywordsCheckConfigDto, name: 'keywords' },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  checkConfig?: AICheckConfigDto | KeywordsCheckConfigDto;

  @ApiProperty({
    description: 'Points awarded for correct answer',
    example: 1,
    default: 1,
  })
  @IsNumber()
  @Min(0)
  points: number;

  @ApiPropertyOptional({
    description: 'Difficulty level',
    enum: Difficulty,
    example: Difficulty.Medium,
  })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({
    description: 'Category of the question',
    example: 'Mathematics',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({
    description: 'Time limit in seconds',
    example: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  timeLimit?: number;

  @ApiProperty({
    description: 'Question content including text, multimedia, answers, hints, and feedback',
    type: QuestionContentDto,
  })
  @ValidateNested()
  @Type(() => QuestionContentDto)
  content: QuestionContentDto;

  @ApiPropertyOptional({
    description: 'Whether the question is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the question is public',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Version of the question',
    example: '1.0',
    default: '1.0',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  version?: string;
}
