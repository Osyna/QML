import {
  Controller,
  Post,
  Get,
  Patch,
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
  ApiBody,
} from '@nestjs/swagger';
import { AnswerService } from './answer.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { User } from '../users/entities/user.entity';
import {
  StartQuestionnaireDto,
  SubmitAnswerDto,
  CompleteQuestionnaireDto,
  QueryAttemptDto,
  AttemptResponseDto,
  AnswerSubmissionResponseDto,
  ManualValidationDto,
} from './dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@ApiTags('Answer Submissions & Attempts')
@Controller('answers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  /**
   * Start a new questionnaire attempt
   */
  @Post('attempts/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Start a new questionnaire attempt',
    description: 'Initiates a new attempt for a questionnaire. Validates availability and retake limits.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Attempt created successfully',
    type: AttemptResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Questionnaire not available, retake limit reached, or attempt already in progress',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Questionnaire not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async startAttempt(
    @CurrentUser() user: User,
    @Body() startDto: StartQuestionnaireDto,
  ): Promise<AttemptResponseDto> {
    return this.answerService.startQuestionnaire(user.id, startDto);
  }

  /**
   * Submit an answer to a question
   */
  @Post('attempts/:attemptId/answers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit an answer to a question',
    description: 'Submits and validates an answer for a specific question in an attempt.',
  })
  @ApiParam({
    name: 'attemptId',
    type: Number,
    description: 'The ID of the attempt',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Answer submitted and validated successfully',
    type: AnswerSubmissionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid submission or answer already submitted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Attempt or question not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async submitAnswer(
    @CurrentUser() user: User,
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @Body() submitDto: SubmitAnswerDto,
  ): Promise<AnswerSubmissionResponseDto> {
    // Ensure attemptId matches the one in the DTO
    submitDto.attemptId = attemptId;
    return this.answerService.submitAnswer(user.id, submitDto);
  }

  /**
   * Complete a questionnaire attempt
   */
  @Post('attempts/:attemptId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete a questionnaire attempt',
    description: 'Finalizes an attempt, calculates final score, and determines pass/fail result.',
  })
  @ApiParam({
    name: 'attemptId',
    type: Number,
    description: 'The ID of the attempt to complete',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempt completed successfully',
    type: AttemptResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Attempt already completed or abandoned',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Attempt not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async completeAttempt(
    @CurrentUser() user: User,
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @Body() completeDto: CompleteQuestionnaireDto,
  ): Promise<AttemptResponseDto> {
    // Ensure attemptId matches the one in the DTO
    completeDto.attemptId = attemptId;
    return this.answerService.completeQuestionnaire(user.id, attemptId, completeDto);
  }

  /**
   * Get details of a specific attempt
   */
  @Get('attempts/:attemptId')
  @ApiOperation({
    summary: 'Get attempt details',
    description: 'Retrieves detailed information about a specific questionnaire attempt.',
  })
  @ApiParam({
    name: 'attemptId',
    type: Number,
    description: 'The ID of the attempt',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attempt details retrieved successfully',
    type: AttemptResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Attempt not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async getAttempt(
    @CurrentUser() user: User,
    @Param('attemptId', ParseIntPipe) attemptId: number,
  ): Promise<AttemptResponseDto> {
    return this.answerService.getAttempt(attemptId, user.id);
  }

  /**
   * Get current user's attempts
   */
  @Get('attempts/my-attempts')
  @ApiOperation({
    summary: 'Get my attempts',
    description: 'Retrieves all attempts for the authenticated user with optional filtering and pagination.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User attempts retrieved successfully',
    type: PaginatedResponseDto<AttemptResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async getMyAttempts(
    @CurrentUser() user: User,
    @Query() queryDto: QueryAttemptDto,
  ): Promise<PaginatedResponseDto<AttemptResponseDto>> {
    return this.answerService.getUserAttempts(user.id, queryDto);
  }

  /**
   * Get all attempts for a questionnaire (admin/educator only)
   */
  @Get('questionnaires/:questionnaireId/attempts')
  @Roles(Role.ADMIN, Role.EDUCATOR)
  @ApiOperation({
    summary: 'Get questionnaire attempts',
    description: 'Retrieves all attempts for a specific questionnaire. Accessible by admins and educators only.',
  })
  @ApiParam({
    name: 'questionnaireId',
    type: Number,
    description: 'The ID of the questionnaire',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Questionnaire attempts retrieved successfully',
    type: PaginatedResponseDto<AttemptResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async getQuestionnaireAttempts(
    @Param('questionnaireId', ParseIntPipe) questionnaireId: number,
    @Query() queryDto: QueryAttemptDto,
  ): Promise<PaginatedResponseDto<AttemptResponseDto>> {
    return this.answerService.getQuestionnaireAttempts(questionnaireId, queryDto);
  }

  /**
   * Manual review of a submission (educator/admin only)
   */
  @Patch('submissions/:submissionId/review')
  @Roles(Role.ADMIN, Role.EDUCATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually review a submission',
    description: 'Allows educators and admins to manually grade and review answer submissions. Updates validation status and recalculates attempt scores.',
  })
  @ApiParam({
    name: 'submissionId',
    type: Number,
    description: 'The ID of the submission to review',
    example: 1,
  })
  @ApiBody({
    type: ManualValidationDto,
    description: 'Manual validation data including status, score, and explanation',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Submission reviewed successfully',
    type: AnswerSubmissionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Submission not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async reviewSubmission(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() validationDto: ManualValidationDto,
  ): Promise<AnswerSubmissionResponseDto> {
    const validationResult = {
      status: validationDto.status,
      score: validationDto.score,
      maxScore: validationDto.maxScore,
      explanation: validationDto.explanation,
    };

    return this.answerService.manualReview(
      submissionId,
      validationResult,
      validationDto.reviewNotes,
    );
  }
}
