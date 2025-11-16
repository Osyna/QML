import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsBoolean, ArrayNotEmpty } from 'class-validator';
import { ExportFormat } from '../import-export.service';

export class ExportQuestionsDto {
  @ApiProperty({
    description: 'Array of question IDs to export',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  questionIds: number[];

  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    example: ExportFormat.JSON,
    required: false,
    default: ExportFormat.JSON,
  })
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat = ExportFormat.JSON;

  @ApiProperty({
    description: 'Include statistics in export',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  includeStatistics?: boolean = false;

  @ApiProperty({
    description: 'Include metadata (ID, timestamps, etc.) in export',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  includeMetadata?: boolean = false;

  @ApiProperty({
    description: 'Include relations (pools, questionnaires) in export',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  includeRelations?: boolean = false;
}
