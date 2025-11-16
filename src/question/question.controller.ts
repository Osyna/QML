import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { QuestionService } from './question.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryQuestionDto } from './dto/query-question.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums';
import { Question } from './entities/question.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@ApiTags('Questions')
@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new question',
    description: 'Create a new question. Only educators and admins can create questions.',
  })
  @ApiResponse({
    status: 201,
    description: 'Question created successfully',
    type: Question,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async create(
    @Body() createQuestionDto: CreateQuestionDto,
    @CurrentUser() user: User,
  ): Promise<Question> {
    return this.questionService.create(createQuestionDto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all questions',
    description: 'Retrieve a paginated list of questions with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
    type: PaginatedResponseDto<Question>,
  })
  async findAll(
    @Query() queryDto: QueryQuestionDto,
  ): Promise<PaginatedResponseDto<Question>> {
    return this.questionService.findAll(queryDto);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search questions',
    description: 'Full-text search across question content, answers, hints, and tags',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query string',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results',
    required: false,
    type: Number,
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: [Question],
  })
  async search(
    @Query('q') searchText: string,
    @Query('limit') limit?: number,
  ): Promise<Question[]> {
    return this.questionService.search(searchText, limit);
  }

  @Get('category/:category')
  @ApiOperation({
    summary: 'Get questions by category',
    description: 'Retrieve all active questions in a specific category',
  })
  @ApiParam({
    name: 'category',
    description: 'Category name',
    type: String,
    example: 'Mathematics',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
    type: [Question],
  })
  async findByCategory(@Param('category') category: string): Promise<Question[]> {
    return this.questionService.findByCategory(category);
  }

  @Get('difficulty/:difficulty')
  @ApiOperation({
    summary: 'Get questions by difficulty',
    description: 'Retrieve all active questions of a specific difficulty level',
  })
  @ApiParam({
    name: 'difficulty',
    description: 'Difficulty level',
    enum: ['easy', 'medium', 'hard'],
    example: 'medium',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
    type: [Question],
  })
  async findByDifficulty(@Param('difficulty') difficulty: string): Promise<Question[]> {
    return this.questionService.findByDifficulty(difficulty as any);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a question by ID',
    description: 'Retrieve a single question with all its relations',
  })
  @ApiParam({
    name: 'id',
    description: 'Question ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Question retrieved successfully',
    type: Question,
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Question> {
    return this.questionService.findOne(id);
  }

  @Get(':id/statistics')
  @ApiOperation({
    summary: 'Get question statistics',
    description: 'Retrieve attempt statistics for a specific question',
  })
  @ApiParam({
    name: 'id',
    description: 'Question ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalAttempts: { type: 'number', example: 100 },
        correctAttempts: { type: 'number', example: 75 },
        averageScore: { type: 'number', example: 0.85 },
        averageTimeSpent: { type: 'number', example: 45.5 },
        successRate: { type: 'number', example: 0.75 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async getStatistics(@Param('id', ParseIntPipe) id: number): Promise<{
    totalAttempts: number;
    correctAttempts: number;
    averageScore: number;
    averageTimeSpent: number;
    successRate: number;
  }> {
    return this.questionService.getStatistics(id);
  }

  @Get(':id/versions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get question version history',
    description: 'Retrieve all versions of a question with their snapshots',
  })
  @ApiParam({
    name: 'id',
    description: 'Question ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Version history retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async getVersionHistory(@Param('id', ParseIntPipe) id: number) {
    return this.questionService.getVersionHistory(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a question',
    description: 'Update a question. Only the owner or admins can update questions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Question ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Question updated successfully',
    type: Question,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner or admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @CurrentUser() user: User,
  ): Promise<Question> {
    // Validate ownership
    const question = await this.questionService.findOne(id);

    // Allow if user is admin or owner
    if (user.role !== Role.ADMIN && question.created_by_id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to update this question',
      );
    }

    return this.questionService.update(id, updateQuestionDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a question (soft delete)',
    description:
      'Soft delete a question by setting isActive to false. Only the owner or admins can delete questions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Question ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Question deleted successfully',
    type: Question,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner or admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Question> {
    // Validate ownership
    const question = await this.questionService.findOne(id);

    // Allow if user is admin or owner
    if (user.role !== Role.ADMIN && question.created_by_id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to delete this question',
      );
    }

    return this.questionService.remove(id);
  }

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Duplicate a question',
    description: 'Create a copy of an existing question',
  })
  @ApiParam({
    name: 'id',
    description: 'Question ID to duplicate',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: 'Question duplicated successfully',
    type: Question,
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
    description: 'Question not found',
  })
  async duplicate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Question> {
    return this.questionService.duplicate(id, user.id);
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Restore a soft-deleted question',
    description: 'Restore a question by setting isActive to true. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Question ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Question restored successfully',
    type: Question,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async restore(@Param('id', ParseIntPipe) id: number): Promise<Question> {
    return this.questionService.restore(id);
  }

  @Delete(':id/hard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Hard delete a question',
    description: 'Permanently delete a question from the database. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Question ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Question permanently deleted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin only',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async hardDelete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.questionService.hardDelete(id);
    return { message: 'Question permanently deleted' };
  }
}
