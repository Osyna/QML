import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsInt,
  IsObject,
  ValidateNested,
  MaxLength,
  MinLength,
  Min,
  Max,
  Matches,
  IsDate,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Difficulty, QuestionnaireType } from '../../common/enums';

export class QuestionnaireSettingsDto {
  @ApiPropertyOptional({ description: 'Show result to user after completion', default: true })
  @IsOptional()
  @IsBoolean()
  showResult?: boolean;

  @ApiPropertyOptional({ description: 'Show feedback to user', default: true })
  @IsOptional()
  @IsBoolean()
  showFeedback?: boolean;

  @ApiPropertyOptional({ description: 'Show difficulty level', default: true })
  @IsOptional()
  @IsBoolean()
  showDifficulty?: boolean;

  @ApiPropertyOptional({ description: 'Show category information', default: true })
  @IsOptional()
  @IsBoolean()
  showCategory?: boolean;

  @ApiPropertyOptional({ description: 'Show tags', default: true })
  @IsOptional()
  @IsBoolean()
  showTags?: boolean;

  @ApiPropertyOptional({ description: 'Show time limit', default: true })
  @IsOptional()
  @IsBoolean()
  showTimeLimit?: boolean;

  @ApiPropertyOptional({ description: 'Show time elapsed/remaining', default: true })
  @IsOptional()
  @IsBoolean()
  showTime?: boolean;

  @ApiPropertyOptional({ description: 'Show points for each question', default: true })
  @IsOptional()
  @IsBoolean()
  showPoints?: boolean;

  @ApiPropertyOptional({ description: 'Show total score', default: true })
  @IsOptional()
  @IsBoolean()
  showScore?: boolean;

  @ApiPropertyOptional({ description: 'Show pass percentage threshold', default: false })
  @IsOptional()
  @IsBoolean()
  showPassPercentage?: boolean;

  @ApiPropertyOptional({ description: 'Show pass points threshold', default: false })
  @IsOptional()
  @IsBoolean()
  showPassPoints?: boolean;

  @ApiPropertyOptional({ description: 'Randomize question order', default: false })
  @IsOptional()
  @IsBoolean()
  randomizeQuestions?: boolean;

  @ApiPropertyOptional({ description: 'Randomize answer options', default: false })
  @IsOptional()
  @IsBoolean()
  randomizeAnswers?: boolean;

  @ApiPropertyOptional({ description: 'Allow reviewing answers', default: true })
  @IsOptional()
  @IsBoolean()
  allowReview?: boolean;

  @ApiPropertyOptional({ description: 'Allow retaking the questionnaire', default: true })
  @IsOptional()
  @IsBoolean()
  allowRetake?: boolean;

  @ApiPropertyOptional({ description: 'Maximum number of retakes allowed', example: 3, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxRetakes?: number;
}

export class PathLogicStructureDto {
  @ApiProperty({
    description: 'Type of path logic node',
    enum: ['path', 'question', 'break', 'end', 'goto'],
    example: 'question',
  })
  @IsNotEmpty()
  @IsEnum(['path', 'question', 'break', 'end', 'goto'])
  type: 'path' | 'question' | 'break' | 'end' | 'goto';

  @ApiPropertyOptional({
    description: 'Question ID for question type nodes',
    example: 1,
  })
  @ValidateIf((o) => o.type === 'question')
  @IsInt()
  @Min(1)
  questionId?: number;

  @ApiPropertyOptional({
    description: 'Answer-based branching logic',
    type: 'object',
    example: {
      '1': { type: 'question', questionId: 2 },
      '2': { type: 'end' },
    },
  })
  @ValidateIf((o) => o.type === 'path')
  @IsOptional()
  @IsObject()
  answers?: {
    [answerId: string]: PathLogicStructureDto;
  };

  @ApiPropertyOptional({
    description: 'Label for goto/break nodes',
    example: 'section_2',
  })
  @ValidateIf((o) => o.type === 'goto' || o.type === 'break')
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({
    description: 'Target label for goto nodes',
    example: 'section_2',
  })
  @ValidateIf((o) => o.type === 'goto')
  @IsString()
  goto?: string;
}

export class CreateQuestionnaireDto {
  @ApiProperty({
    description: 'Name of the questionnaire',
    example: 'JavaScript Assessment Quiz',
    minLength: 3,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the questionnaire',
    example: 'A comprehensive assessment to test JavaScript knowledge',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorizing and filtering the questionnaire',
    example: ['javascript', 'assessment', 'frontend'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Type of questionnaire',
    enum: QuestionnaireType,
    default: QuestionnaireType.QuestionsAnswers,
  })
  @IsOptional()
  @IsEnum(QuestionnaireType)
  type?: QuestionnaireType;

  @ApiPropertyOptional({
    description: 'Maximum number of questions to display (for random questionnaires)',
    example: 20,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxQuestions?: number;

  @ApiPropertyOptional({
    description: 'Version of the questionnaire',
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
    description: 'Difficulty level of the questionnaire',
    enum: Difficulty,
    example: Difficulty.Medium,
  })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({
    description: 'Category of the questionnaire',
    example: 'Programming Languages',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  category?: string;

  @ApiPropertyOptional({
    description: 'Time limit in minutes',
    example: 60,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  timeLimit?: number;

  @ApiPropertyOptional({
    description: 'Total points available',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({
    description: 'Percentage required to pass (0-100)',
    example: 70,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passPercentage?: number;

  @ApiPropertyOptional({
    description: 'Points required to pass',
    example: 70,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passPoints?: number;

  @ApiPropertyOptional({
    description: 'Message shown when user passes',
    example: 'Congratulations! You passed the assessment.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  passText?: string;

  @ApiPropertyOptional({
    description: 'Message shown when user fails',
    example: 'Unfortunately, you did not pass. Please try again.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  failText?: string;

  @ApiPropertyOptional({
    description: 'General feedback for the questionnaire',
    example: 'Thank you for completing this assessment.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  feedback?: string;

  @ApiPropertyOptional({
    description: 'Questionnaire settings',
    type: QuestionnaireSettingsDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => QuestionnaireSettingsDto)
  settings?: QuestionnaireSettingsDto;

  @ApiPropertyOptional({
    description: 'Path logic structure for adaptive questionnaires',
    type: [PathLogicStructureDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PathLogicStructureDto)
  pathLogic?: PathLogicStructureDto[];

  @ApiPropertyOptional({
    description: 'Whether the questionnaire is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the questionnaire is publicly accessible',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Start date for questionnaire availability',
    example: '2025-01-01T00:00:00Z',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'End date for questionnaire availability',
    example: '2025-12-31T23:59:59Z',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @ValidateIf((o) => o.startDate && o.endDate)
  endDate?: Date;
}
