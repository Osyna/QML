import {
  Controller,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
  Res,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ImportExportService, ExportFormat } from './import-export.service';
import { ExportQuestionsDto } from './dto/export-questions.dto';
import { ExportQuestionnaireDto } from './dto/export-questionnaire.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums';

@ApiTags('Import/Export')
@Controller('import-export')
export class ImportExportController {
  private readonly logger = new Logger(ImportExportController.name);

  constructor(private readonly importExportService: ImportExportService) {}

  @Post('questions/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Export questions',
    description:
      'Export multiple questions in various formats (JSON, CSV, QTI, GIFT). Only educators and admins can export questions.',
  })
  @ApiBody({ type: ExportQuestionsDto })
  @ApiResponse({
    status: 200,
    description: 'Questions exported successfully',
    content: {
      'application/json': {
        schema: { type: 'string' },
      },
      'text/csv': {
        schema: { type: 'string' },
      },
      'application/xml': {
        schema: { type: 'string' },
      },
      'text/plain': {
        schema: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or unsupported format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'No questions found with the provided IDs',
  })
  async exportQuestions(
    @Body() exportDto: ExportQuestionsDto,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(
      `Exporting ${exportDto.questionIds.length} questions in ${exportDto.format} format`,
    );

    const result = await this.importExportService.exportQuestions(
      exportDto.questionIds,
      exportDto.format,
      {
        includeStatistics: exportDto.includeStatistics,
        includeMetadata: exportDto.includeMetadata,
        includeRelations: exportDto.includeRelations,
      },
    );

    // Set appropriate content type and filename based on format
    const { contentType, extension } = this.getContentTypeAndExtension(
      exportDto.format,
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="questions_export.${extension}"`,
    );

    res.send(result);
  }

  @Post('questionnaires/:id/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Export questionnaire',
    description:
      'Export a questionnaire with all its questions in various formats. Only educators and admins can export questionnaires.',
  })
  @ApiParam({
    name: 'id',
    description: 'Questionnaire ID',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: ExportQuestionnaireDto })
  @ApiResponse({
    status: 200,
    description: 'Questionnaire exported successfully',
    content: {
      'application/json': {
        schema: { type: 'string' },
      },
      'text/csv': {
        schema: { type: 'string' },
      },
      'application/xml': {
        schema: { type: 'string' },
      },
      'text/plain': {
        schema: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or unsupported format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Questionnaire not found',
  })
  async exportQuestionnaire(
    @Param('id', ParseIntPipe) id: number,
    @Body() exportDto: ExportQuestionnaireDto,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(
      `Exporting questionnaire ${id} in ${exportDto.format} format`,
    );

    const result = await this.importExportService.exportQuestionnaire(
      id,
      exportDto.format,
      {
        includeStatistics: exportDto.includeStatistics,
        includeMetadata: exportDto.includeMetadata,
        includeRelations: exportDto.includeRelations,
      },
    );

    const { contentType, extension } = this.getContentTypeAndExtension(
      exportDto.format,
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="questionnaire_${id}_export.${extension}"`,
    );

    res.send(result);
  }

  @Post('questions/import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Import questions from file',
    description:
      'Import questions from a file in various formats (JSON, CSV, QTI, GIFT). Only educators and admins can import questions.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'format'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File containing questions to import',
        },
        format: {
          type: 'string',
          enum: ['json', 'csv', 'qti', 'gift'],
          description: 'Format of the import file',
          example: 'json',
        },
      },
    },
  })
  @ApiQuery({
    name: 'format',
    enum: ExportFormat,
    description: 'Format of the import file',
    required: true,
    example: ExportFormat.JSON,
  })
  @ApiResponse({
    status: 201,
    description: 'Questions imported successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Successfully imported 10 questions' },
        importedCount: { type: 'number', example: 10 },
        questions: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid file format, unsupported format, or validation errors',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async importQuestions(
    @UploadedFile() file: Express.Multer.File,
    @Query('format') format: ExportFormat,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!format) {
      throw new BadRequestException('Format parameter is required');
    }

    // Validate format
    if (!Object.values(ExportFormat).includes(format)) {
      throw new BadRequestException(
        `Unsupported format: ${format}. Supported formats: ${Object.values(ExportFormat).join(', ')}`,
      );
    }

    this.logger.log(
      `Importing questions from ${format} file: ${file.originalname}`,
    );

    const questions = await this.importExportService.importQuestions(
      file.buffer,
      format,
      user.id,
    );

    return {
      message: `Successfully imported ${questions.length} questions`,
      importedCount: questions.length,
      questions: questions.map((q) => ({
        id: q.id,
        type: q.type,
        text: q.content.text,
        category: q.category,
        difficulty: q.difficulty,
      })),
    };
  }

  @Post('questionnaires/import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Import questionnaire from file',
    description:
      'Import a questionnaire with all its questions from a JSON file. Only educators and admins can import questionnaires.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JSON file containing questionnaire and questions',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Questionnaire imported successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Successfully imported questionnaire with 10 questions',
        },
        questionnaire: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid file format or validation errors. Note: Only JSON format is supported for questionnaire import.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async importQuestionnaire(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.logger.log(`Importing questionnaire from file: ${file.originalname}`);

    const questionnaire = await this.importExportService.importQuestionnaire(
      file.buffer,
      ExportFormat.JSON, // Only JSON supported for questionnaires
      user.id,
    );

    return {
      message: `Successfully imported questionnaire with ${questionnaire.questions?.length || 0} questions`,
      questionnaire: {
        id: questionnaire.id,
        name: questionnaire.name,
        description: questionnaire.description,
        questionCount: questionnaire.questions?.length || 0,
      },
    };
  }

  /**
   * Helper method to get content type and file extension based on format
   */
  private getContentTypeAndExtension(format: ExportFormat): {
    contentType: string;
    extension: string;
  } {
    switch (format) {
      case ExportFormat.JSON:
        return { contentType: 'application/json', extension: 'json' };
      case ExportFormat.CSV:
        return { contentType: 'text/csv', extension: 'csv' };
      case ExportFormat.QTI:
        return { contentType: 'application/xml', extension: 'xml' };
      case ExportFormat.GIFT:
        return { contentType: 'text/plain', extension: 'gift' };
      default:
        return { contentType: 'application/octet-stream', extension: 'txt' };
    }
  }
}
