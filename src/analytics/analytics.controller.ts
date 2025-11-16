import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
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
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';
import { User } from '../users/entities/user.entity';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('questions/:id')
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Get question statistics',
    description: 'Get detailed statistics for a specific question. Accessible by educators and admins only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Question ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Question statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        questionId: { type: 'number' },
        totalAttempts: { type: 'number' },
        correctAttempts: { type: 'number' },
        incorrectAttempts: { type: 'number' },
        partialAttempts: { type: 'number' },
        successRate: { type: 'number' },
        averageScore: { type: 'number' },
        averageTimeSpent: { type: 'number' },
        medianTimeSpent: { type: 'number' },
        standardDeviation: { type: 'number' },
        discriminationIndex: { type: 'number' },
        difficultyIndex: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires educator or admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async getQuestionStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.analyticsService.getQuestionStatistics(id);
  }

  @Get('questionnaires/:id')
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Get questionnaire statistics',
    description: 'Get comprehensive statistics for a questionnaire including all questions. Accessible by educators and admins.',
  })
  @ApiParam({
    name: 'id',
    description: 'Questionnaire ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Questionnaire statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        questionnaireId: { type: 'number' },
        totalAttempts: { type: 'number' },
        completedAttempts: { type: 'number' },
        inProgressAttempts: { type: 'number' },
        abandonedAttempts: { type: 'number' },
        averageScore: { type: 'number' },
        averagePercentage: { type: 'number' },
        averageCompletionTime: { type: 'number' },
        medianScore: { type: 'number' },
        passRate: { type: 'number' },
        completionRate: { type: 'number' },
        questionsStatistics: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires educator or admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'Questionnaire not found',
  })
  async getQuestionnaireStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.analyticsService.getQuestionnaireStatistics(id);
  }

  @Get('users/:id')
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Get performance statistics for a user. Users can only view their own statistics unless they are admins.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number' },
        totalAttempts: { type: 'number' },
        completedAttempts: { type: 'number' },
        averageScore: { type: 'number' },
        averagePercentage: { type: 'number' },
        totalTimeSpent: { type: 'number' },
        averageTimePerAttempt: { type: 'number' },
        passRate: { type: 'number' },
        strongCategories: {
          type: 'array',
          items: { type: 'string' },
        },
        weakCategories: {
          type: 'array',
          items: { type: 'string' },
        },
        recentPerformance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date-time' },
              score: { type: 'number' },
              percentage: { type: 'number' },
              questionnaireName: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only view own statistics unless admin',
  })
  async getUserStatistics(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ) {
    // Users can only view their own statistics unless they're admins
    if (currentUser.id !== id && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'You can only view your own statistics unless you are an admin',
      );
    }

    return this.analyticsService.getUserStatistics(id);
  }

  @Get('questions/:id/difficulty')
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Get question difficulty analysis',
    description: 'Analyze question difficulty based on actual performance data. Accessible by educators and admins.',
  })
  @ApiParam({
    name: 'id',
    description: 'Question ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Difficulty analysis retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        questionId: { type: 'number' },
        difficultyIndex: { type: 'number', description: '0-1, higher = harder' },
        difficultyLevel: {
          type: 'string',
          enum: ['easy', 'medium', 'hard', 'very-hard'],
        },
        totalAttempts: { type: 'number' },
        successRate: { type: 'number' },
        averageTimeSpent: { type: 'number' },
        recommendation: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires educator or admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async getQuestionDifficultyAnalysis(@Param('id', ParseIntPipe) id: number) {
    return this.analyticsService.getQuestionDifficultyAnalysis(id);
  }

  @Get('questions/:id/discrimination')
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Get discrimination index',
    description: 'Calculate how well the question separates high and low performers. Higher values (0.3+) indicate better discrimination. Accessible by educators and admins.',
  })
  @ApiParam({
    name: 'id',
    description: 'Question ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Discrimination index retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        questionId: { type: 'number' },
        discriminationIndex: {
          type: 'number',
          description: '-1 to 1, higher is better, 0.3+ is good',
        },
        quality: {
          type: 'string',
          enum: ['excellent', 'good', 'fair', 'poor', 'problematic'],
        },
        upperGroupSuccess: {
          type: 'number',
          description: 'Success rate of top 27% performers',
        },
        lowerGroupSuccess: {
          type: 'number',
          description: 'Success rate of bottom 27% performers',
        },
        totalAttempts: { type: 'number' },
        recommendation: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires educator or admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async getDiscriminationIndex(@Param('id', ParseIntPipe) id: number) {
    return this.analyticsService.getDiscriminationIndex(id);
  }

  @Get('questionnaires/:id/time-by-difficulty')
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Get average time by difficulty',
    description: 'Analyze average time spent on questions grouped by difficulty level. Accessible by educators and admins.',
  })
  @ApiParam({
    name: 'id',
    description: 'Questionnaire ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Time analysis retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        questionnaireId: { type: 'number' },
        easyQuestions: {
          type: 'object',
          properties: {
            averageTime: { type: 'number' },
            medianTime: { type: 'number' },
            count: { type: 'number' },
          },
        },
        mediumQuestions: {
          type: 'object',
          properties: {
            averageTime: { type: 'number' },
            medianTime: { type: 'number' },
            count: { type: 'number' },
          },
        },
        hardQuestions: {
          type: 'object',
          properties: {
            averageTime: { type: 'number' },
            medianTime: { type: 'number' },
            count: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires educator or admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'Questionnaire not found',
  })
  async getAverageTimeByDifficulty(@Param('id', ParseIntPipe) id: number) {
    return this.analyticsService.getAverageTimeByDifficulty(id);
  }

  @Get('questionnaires/:id/completion')
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Get completion rate analysis',
    description: 'Analyze questionnaire completion rates and identify drop-off points. Accessible by educators and admins.',
  })
  @ApiParam({
    name: 'id',
    description: 'Questionnaire ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Completion rate analysis retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        questionnaireId: { type: 'number' },
        totalAttempts: { type: 'number' },
        completedAttempts: { type: 'number' },
        completionRate: { type: 'number' },
        averageCompletionTime: { type: 'number' },
        medianCompletionTime: { type: 'number' },
        dropOffPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              questionIndex: { type: 'number' },
              questionId: { type: 'number' },
              dropOffCount: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires educator or admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'Questionnaire not found',
  })
  async getCompletionRate(@Param('id', ParseIntPipe) id: number) {
    return this.analyticsService.getCompletionRate(id);
  }

  @Get('questions/:id/trends')
  @Roles(Role.EDUCATOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Get question performance trends',
    description: 'Analyze performance trends over time for a specific question. Accessible by educators and admins.',
  })
  @ApiParam({
    name: 'id',
    description: 'Question ID',
    type: Number,
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date for the analysis (ISO 8601 format)',
    required: true,
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date for the analysis (ISO 8601 format)',
    required: true,
    type: String,
    example: '2024-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance trends retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        questionId: { type: 'number' },
        dateRange: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' },
          },
        },
        dataPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              attempts: { type: 'number' },
              successRate: { type: 'number' },
              averageScore: { type: 'number' },
              averageTime: { type: 'number' },
            },
          },
        },
        trend: {
          type: 'string',
          enum: ['improving', 'declining', 'stable'],
        },
        trendSlope: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid date format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires educator or admin role',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async getQuestionPerformanceTrends(
    @Param('id', ParseIntPipe) id: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const dateRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };

    return this.analyticsService.getQuestionPerformanceTrends(id, dateRange);
  }
}
