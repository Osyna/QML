import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { QuestionPoolService } from './question-pool.service';
import { CreateQuestionPoolDto } from './dto/create-question-pool.dto';
import { UpdateQuestionPoolDto } from './dto/update-question-pool.dto';
import { QueryQuestionPoolDto } from './dto/query-question-pool.dto';
import { AddQuestionsToPoolDto } from './dto/add-questions-to-pool.dto';
import { QuestionPool } from './entities/question-pool.entity';
import { Question } from '../question/entities/question.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('Question Pools')
@Controller('question-pools')
export class QuestionPoolController {
  constructor(private readonly questionPoolService: QuestionPoolService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDUCATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new question pool',
    description: 'Creates a new question pool. Requires authentication and EDUCATOR or ADMIN role.',
  })
  @ApiResponse({
    status: 201,
    description: 'The question pool has been successfully created.',
    type: QuestionPool,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data.',
  })
  async create(
    @Body() createQuestionPoolDto: CreateQuestionPoolDto,
    @CurrentUser('id') userId: number,
  ): Promise<QuestionPool> {
    return await this.questionPoolService.create(createQuestionPoolDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all question pools',
    description: 'Retrieves a paginated list of question pools with optional filters.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved question pools.',
    type: PaginatedResponseDto,
  })
  async findAll(
    @Query() queryDto: QueryQuestionPoolDto,
  ): Promise<PaginatedResponseDto<QuestionPool>> {
    return await this.questionPoolService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a question pool by ID',
    description: 'Retrieves a single question pool with its relations (questions, creator).',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the question pool',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved the question pool.',
    type: QuestionPool,
  })
  @ApiResponse({
    status: 404,
    description: 'Question pool not found.',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<QuestionPool> {
    return await this.questionPoolService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a question pool',
    description: 'Updates a question pool. Only the owner or admin can update the pool.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the question pool to update',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'The question pool has been successfully updated.',
    type: QuestionPool,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You do not have permission to update this pool.',
  })
  @ApiResponse({
    status: 404,
    description: 'Question pool not found.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionPoolDto: UpdateQuestionPoolDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: Role,
  ): Promise<QuestionPool> {
    return await this.questionPoolService.update(
      id,
      updateQuestionPoolDto,
      userId,
      userRole,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a question pool',
    description: 'Soft deletes a question pool by setting isActive to false. Only the owner or admin can delete the pool.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the question pool to delete',
    type: Number,
  })
  @ApiResponse({
    status: 204,
    description: 'The question pool has been successfully deleted (soft delete).',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You do not have permission to delete this pool.',
  })
  @ApiResponse({
    status: 404,
    description: 'Question pool not found.',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: Role,
  ): Promise<void> {
    await this.questionPoolService.remove(id, userId, userRole);
  }

  @Post(':id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add questions to a pool',
    description: 'Adds one or more questions to a question pool. Only the owner or admin can modify the pool.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the question pool',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Questions have been successfully added to the pool.',
    type: QuestionPool,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid question IDs or questions already in pool.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You do not have permission to modify this pool.',
  })
  @ApiResponse({
    status: 404,
    description: 'Question pool or questions not found.',
  })
  async addQuestions(
    @Param('id', ParseIntPipe) id: number,
    @Body() addQuestionsDto: AddQuestionsToPoolDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: Role,
  ): Promise<QuestionPool> {
    return await this.questionPoolService.addQuestions(
      id,
      addQuestionsDto.questionIds,
      userId,
      userRole,
    );
  }

  @Delete(':id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove questions from a pool',
    description: 'Removes one or more questions from a question pool. Only the owner or admin can modify the pool.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the question pool',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Questions have been successfully removed from the pool.',
    type: QuestionPool,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Pool has no questions.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - You do not have permission to modify this pool.',
  })
  @ApiResponse({
    status: 404,
    description: 'Question pool not found.',
  })
  async removeQuestions(
    @Param('id', ParseIntPipe) id: number,
    @Body() removeQuestionsDto: AddQuestionsToPoolDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') userRole: Role,
  ): Promise<QuestionPool> {
    return await this.questionPoolService.removeQuestions(
      id,
      removeQuestionsDto.questionIds,
      userId,
      userRole,
    );
  }

  @Get(':id/questions')
  @ApiOperation({
    summary: 'Get questions in a pool',
    description: 'Retrieves all questions in a question pool with optional filters.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the question pool',
    type: Number,
  })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    description: 'Filter by difficulty level',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by question type',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved questions from the pool.',
    type: [Question],
  })
  @ApiResponse({
    status: 404,
    description: 'Question pool not found.',
  })
  async getQuestions(
    @Param('id', ParseIntPipe) id: number,
    @Query('difficulty') difficulty?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: boolean,
  ): Promise<Question[]> {
    const filters = {
      difficulty,
      category,
      type,
      isActive,
    };

    return await this.questionPoolService.getQuestions(id, filters);
  }

  @Get(':id/random')
  @ApiOperation({
    summary: 'Get random questions from a pool',
    description: 'Retrieves a specified number of random active questions from a question pool.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the question pool',
    type: Number,
  })
  @ApiQuery({
    name: 'count',
    required: true,
    type: Number,
    description: 'Number of random questions to retrieve',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved random questions from the pool.',
    type: [Question],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid count or insufficient questions in pool.',
  })
  @ApiResponse({
    status: 404,
    description: 'Question pool not found.',
  })
  async getRandomQuestions(
    @Param('id', ParseIntPipe) id: number,
    @Query('count', ParseIntPipe) count: number,
  ): Promise<Question[]> {
    return await this.questionPoolService.getRandomQuestions(id, count);
  }
}
