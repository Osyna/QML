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
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { QuestionnaireService } from './questionnaire.service';
import {
  CreateQuestionnaireDto,
  UpdateQuestionnaireDto,
  QueryQuestionnaireDto,
  AddQuestionsToQuestionnaireDto,
} from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';
import { User } from '../users/entities/user.entity';
import { Questionnaire } from './entities/questionnaire.entity';
import { Question } from '../question/entities/question.entity';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@ApiTags('Questionnaires')
@Controller('questionnaires')
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new questionnaire',
    description: 'Create a new questionnaire. Only educators and admins can create questionnaires.',
  })
  @ApiResponse({
    status: 201,
    description: 'Questionnaire created successfully',
    type: Questionnaire,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async create(
    @Body() createDto: CreateQuestionnaireDto,
    @CurrentUser('id') userId: number,
  ): Promise<Questionnaire> {
    return await this.questionnaireService.create(createDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all questionnaires',
    description: 'Retrieve a paginated list of questionnaires with optional filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'List of questionnaires retrieved successfully',
    type: PaginatedResponseDto<Questionnaire>,
  })
  async findAll(
    @Query() queryDto: QueryQuestionnaireDto,
  ): Promise<PaginatedResponseDto<Questionnaire>> {
    return await this.questionnaireService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get questionnaire by ID',
    description: 'Retrieve detailed information about a specific questionnaire including all relations',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Questionnaire ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Questionnaire retrieved successfully',
    type: Questionnaire,
  })
  @ApiResponse({
    status: 404,
    description: 'Questionnaire not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Questionnaire> {
    return await this.questionnaireService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a questionnaire',
    description: 'Update a questionnaire. Only the owner or an admin can update.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Questionnaire ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Questionnaire updated successfully',
    type: Questionnaire,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not the owner or admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Questionnaire not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateQuestionnaireDto,
    @CurrentUser() user: User,
  ): Promise<Questionnaire> {
    const questionnaire = await this.questionnaireService.findOne(id);

    // Admins can update any questionnaire, educators can only update their own
    if (user.role !== Role.ADMIN && questionnaire.created_by_id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to update this questionnaire',
      );
    }

    return await this.questionnaireService.update(id, updateDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a questionnaire',
    description: 'Soft delete a questionnaire (sets isActive to false). Only the owner or an admin can delete.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Questionnaire ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Questionnaire deleted successfully',
    type: Questionnaire,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not the owner or admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Questionnaire not found',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<Questionnaire> {
    const questionnaire = await this.questionnaireService.findOne(id);

    // Admins can delete any questionnaire, educators can only delete their own
    if (user.role !== Role.ADMIN && questionnaire.created_by_id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to delete this questionnaire',
      );
    }

    // Admins can hard delete without ownership check
    const userId = user.role === Role.ADMIN ? undefined : user.id;
    return await this.questionnaireService.remove(id, userId);
  }

  @Post(':id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add questions to a questionnaire',
    description: 'Add one or more questions to a questionnaire. Only the owner or an admin can add questions.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Questionnaire ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Questions added successfully',
    type: Questionnaire,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or questions already exist',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not the owner or admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Questionnaire or questions not found',
  })
  async addQuestions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddQuestionsToQuestionnaireDto,
    @CurrentUser() user: User,
  ): Promise<Questionnaire> {
    const questionnaire = await this.questionnaireService.findOne(id);

    // Admins can modify any questionnaire, educators can only modify their own
    if (user.role !== Role.ADMIN && questionnaire.created_by_id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to modify this questionnaire',
      );
    }

    return await this.questionnaireService.addQuestions(id, dto.questionIds);
  }

  @Delete(':id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove questions from a questionnaire',
    description: 'Remove one or more questions from a questionnaire. Only the owner or an admin can remove questions.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Questionnaire ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Questions removed successfully',
    type: Questionnaire,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - questions not found in questionnaire',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not the owner or admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Questionnaire not found',
  })
  async removeQuestions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddQuestionsToQuestionnaireDto,
    @CurrentUser() user: User,
  ): Promise<Questionnaire> {
    const questionnaire = await this.questionnaireService.findOne(id);

    // Admins can modify any questionnaire, educators can only modify their own
    if (user.role !== Role.ADMIN && questionnaire.created_by_id !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to modify this questionnaire',
      );
    }

    return await this.questionnaireService.removeQuestions(id, dto.questionIds);
  }

  @Get(':id/questions')
  @ApiOperation({
    summary: 'Get questions for a questionnaire',
    description: 'Retrieve all questions associated with a questionnaire',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Questionnaire ID',
    example: 1,
  })
  @ApiQuery({
    name: 'randomize',
    type: 'boolean',
    required: false,
    description: 'Randomize question order',
  })
  @ApiQuery({
    name: 'limit',
    type: 'number',
    required: false,
    description: 'Limit number of questions returned',
  })
  @ApiQuery({
    name: 'includeInactive',
    type: 'boolean',
    required: false,
    description: 'Include inactive questions',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
    type: [Question],
  })
  @ApiResponse({
    status: 404,
    description: 'Questionnaire not found',
  })
  async getQuestions(
    @Param('id', ParseIntPipe) id: number,
    @Query('randomize') randomize?: boolean,
    @Query('limit') limit?: number,
    @Query('includeInactive') includeInactive?: boolean,
  ): Promise<Question[]> {
    return await this.questionnaireService.getQuestions(id, {
      randomize,
      limit: limit ? Number(limit) : undefined,
      includeInactive,
    });
  }

  @Get(':id/validate')
  @ApiOperation({
    summary: 'Validate questionnaire availability',
    description: 'Check if a questionnaire is available for taking (date range and active status)',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Questionnaire ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Availability status returned',
    schema: {
      type: 'object',
      properties: {
        available: {
          type: 'boolean',
          description: 'Whether the questionnaire is available',
        },
        reason: {
          type: 'string',
          description: 'Reason for unavailability (if applicable)',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Questionnaire not found',
  })
  async validateAvailability(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ available: boolean; reason?: string }> {
    return await this.questionnaireService.validateAvailability(id);
  }

  @Get(':id/total-points')
  @ApiOperation({
    summary: 'Calculate total points',
    description: 'Calculate the total points available for a questionnaire',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Questionnaire ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Total points calculated successfully',
    schema: {
      type: 'object',
      properties: {
        totalPoints: {
          type: 'number',
          description: 'Total points for the questionnaire',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Questionnaire not found',
  })
  async calculateTotalPoints(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ totalPoints: number }> {
    const totalPoints = await this.questionnaireService.calculateTotalPoints(id);
    return { totalPoints };
  }

  @Get(':id/random-questions')
  @ApiOperation({
    summary: 'Get random questions',
    description: 'Get random questions for RandomQuestions type questionnaire',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Questionnaire ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Random questions retrieved successfully',
    type: [Question],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - not a RandomQuestions type questionnaire',
  })
  @ApiResponse({
    status: 404,
    description: 'Questionnaire not found',
  })
  async getRandomQuestions(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Question[]> {
    return await this.questionnaireService.getRandomQuestions(id);
  }
}
