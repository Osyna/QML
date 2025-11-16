import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  UseGuards,
  Logger,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AnswerService } from '../answer/answer.service';
import { QuestionnaireService } from '../questionnaire/questionnaire.service';
import { UsersService } from '../users/users.service';
import {
  JoinQuizDto,
  LeaveQuizDto,
  SubmitAnswerDto,
  NextQuestionDto,
  QuizCompleteDto,
  GetLeaderboardDto,
  LeaderboardDto,
  LeaderboardEntry,
  QuestionUpdateDto,
  QuizUpdateDto,
  QuizStartedDto,
  QuizEndedDto,
  AnswerValidatedDto,
  ParticipantJoinedDto,
  ParticipantLeftDto,
  QuizSessionStatsDto,
} from './dto/quiz-events.dto';
import { AttemptStatus } from '../answer/entities/questionnaire-attempt.entity';

/**
 * Interface for connected client metadata
 */
interface ClientMetadata {
  userId: number;
  attemptId?: number;
  questionnaireId?: number;
  userName: string;
  email: string;
  connectedAt: Date;
}

/**
 * Interface for quiz session room
 */
interface QuizSession {
  questionnaireId: number;
  participants: Map<number, ClientMetadata>; // userId -> metadata
  currentQuestion: Map<number, number>; // attemptId -> questionId
  startedAt: Date;
  lastActivity: Date;
}

/**
 * WebSocket Gateway for real-time quiz sessions
 *
 * Features:
 * - Real-time quiz participation
 * - Live leaderboard updates
 * - Question progression synchronization
 * - Answer submission with instant validation
 * - Participant tracking
 * - JWT-based authentication
 */
@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // Configure this based on your CORS requirements
    credentials: true,
  },
  namespace: '/quiz',
  transports: ['websocket', 'polling'],
})
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QuizGateway.name);
  private clients: Map<string, ClientMetadata> = new Map(); // socketId -> metadata
  private sessions: Map<number, QuizSession> = new Map(); // questionnaireId -> session

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly answerService: AnswerService,
    private readonly questionnaireService: QuestionnaireService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      this.logger.log(`Client attempting to connect: ${client.id}`);

      // Extract and validate JWT token
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.verifyToken(token);
      if (!payload) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.emit('error', { message: 'Invalid or expired token' });
        client.disconnect();
        return;
      }

      // Fetch user details
      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.isActive) {
        this.logger.warn(`Connection rejected: User not found or inactive`);
        client.emit('error', { message: 'User not found or inactive' });
        client.disconnect();
        return;
      }

      // Store client metadata
      const metadata: ClientMetadata = {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        connectedAt: new Date(),
      };

      this.clients.set(client.id, metadata);
      this.logger.log(
        `Client connected: ${client.id} (User: ${metadata.userName})`,
      );

      // Emit connection success
      client.emit('connected', {
        message: 'Successfully connected to quiz gateway',
        userId: user.id,
        userName: metadata.userName,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`, error.stack);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    try {
      const metadata = this.clients.get(client.id);
      if (metadata) {
        this.logger.log(
          `Client disconnecting: ${client.id} (User: ${metadata.userName})`,
        );

        // Leave all quiz rooms
        if (metadata.questionnaireId) {
          await this.handleLeaveQuiz(client, {
            attemptId: metadata.attemptId,
            reason: 'Disconnected',
          });
        }

        this.clients.delete(client.id);
      } else {
        this.logger.log(`Unknown client disconnected: ${client.id}`);
      }
    } catch (error) {
      this.logger.error(`Disconnect error: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle joining a quiz session
   */
  @SubscribeMessage('join-quiz')
  async handleJoinQuiz(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinQuizDto,
  ) {
    try {
      const metadata = this.clients.get(client.id);
      if (!metadata) {
        throw new WsException('Client not authenticated');
      }

      this.logger.log(
        `User ${metadata.userName} joining quiz ${data.questionnaireId}`,
      );

      // Validate questionnaire exists
      const questionnaire = await this.questionnaireService.findOne(
        data.questionnaireId,
      );

      // Validate attempt belongs to user
      const attempt = await this.answerService.getAttempt(
        data.attemptId,
        metadata.userId,
      );

      if (attempt.questionnaire.id !== data.questionnaireId) {
        throw new WsException('Attempt does not belong to this questionnaire');
      }

      // Update client metadata
      metadata.attemptId = data.attemptId;
      metadata.questionnaireId = data.questionnaireId;
      this.clients.set(client.id, metadata);

      // Join room for this questionnaire
      const roomName = `quiz-${data.questionnaireId}`;
      await client.join(roomName);

      // Create or update session
      if (!this.sessions.has(data.questionnaireId)) {
        this.sessions.set(data.questionnaireId, {
          questionnaireId: data.questionnaireId,
          participants: new Map(),
          currentQuestion: new Map(),
          startedAt: new Date(),
          lastActivity: new Date(),
        });
      }

      const session = this.sessions.get(data.questionnaireId);
      session.participants.set(metadata.userId, metadata);
      session.lastActivity = new Date();

      // Emit participant joined event to room
      const participantJoined: ParticipantJoinedDto = {
        userId: metadata.userId,
        userName: metadata.userName,
        questionnaireId: data.questionnaireId,
        joinedAt: new Date(),
      };

      this.server.to(roomName).emit('participant-joined', participantJoined);

      // Emit quiz started event to the client
      const quizStarted: QuizStartedDto = {
        attemptId: attempt.id,
        questionnaireId: questionnaire.id,
        userId: metadata.userId,
        userName: metadata.userName,
        totalQuestions: questionnaire.questions?.length || 0,
        timeLimit: questionnaire.timeLimit,
        startedAt: attempt.startedAt,
      };

      client.emit('quiz-started', quizStarted);

      // Send current session stats to all participants
      await this.broadcastSessionStats(data.questionnaireId);

      // Send leaderboard update
      await this.broadcastLeaderboard(data.questionnaireId);

      return {
        success: true,
        message: 'Successfully joined quiz session',
        session: {
          questionnaireId: data.questionnaireId,
          attemptId: data.attemptId,
          activeParticipants: session.participants.size,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error joining quiz: ${error.message}`,
        error.stack,
      );
      throw new WsException(error.message || 'Failed to join quiz');
    }
  }

  /**
   * Handle leaving a quiz session
   */
  @SubscribeMessage('leave-quiz')
  async handleLeaveQuiz(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LeaveQuizDto,
  ) {
    try {
      const metadata = this.clients.get(client.id);
      if (!metadata || !metadata.questionnaireId) {
        return { success: true, message: 'Not in any quiz session' };
      }

      this.logger.log(
        `User ${metadata.userName} leaving quiz ${metadata.questionnaireId}`,
      );

      const roomName = `quiz-${metadata.questionnaireId}`;
      const session = this.sessions.get(metadata.questionnaireId);

      if (session) {
        session.participants.delete(metadata.userId);
        session.currentQuestion.delete(data.attemptId);

        // Emit participant left event
        const participantLeft: ParticipantLeftDto = {
          userId: metadata.userId,
          userName: metadata.userName,
          questionnaireId: metadata.questionnaireId,
          reason: data.reason,
          leftAt: new Date(),
        };

        this.server.to(roomName).emit('participant-left', participantLeft);

        // Clean up empty sessions
        if (session.participants.size === 0) {
          this.sessions.delete(metadata.questionnaireId);
        } else {
          // Update session stats
          await this.broadcastSessionStats(metadata.questionnaireId);
        }
      }

      // Leave room
      await client.leave(roomName);

      // Clear metadata
      metadata.attemptId = undefined;
      metadata.questionnaireId = undefined;
      this.clients.set(client.id, metadata);

      return {
        success: true,
        message: 'Successfully left quiz session',
      };
    } catch (error) {
      this.logger.error(`Error leaving quiz: ${error.message}`, error.stack);
      throw new WsException(error.message || 'Failed to leave quiz');
    }
  }

  /**
   * Handle real-time answer submission
   */
  @SubscribeMessage('submit-answer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubmitAnswerDto,
  ) {
    try {
      const metadata = this.clients.get(client.id);
      if (!metadata) {
        throw new WsException('Client not authenticated');
      }

      this.logger.log(
        `User ${metadata.userName} submitting answer for question ${data.questionId}`,
      );

      // Submit answer using the answer service
      const submission = await this.answerService.submitAnswer(
        metadata.userId,
        {
          attemptId: data.attemptId,
          questionId: data.questionId,
          userAnswer: data.userAnswer,
          hintsUsed: data.hintsUsed,
          timeSpent: data.timeSpent,
          flaggedForReview: data.flaggedForReview,
        },
      );

      // Emit answer validated event back to the client
      const answerValidated: AnswerValidatedDto = {
        attemptId: data.attemptId,
        questionId: data.questionId,
        status: submission.validationStatus,
        score: submission.validationResult.score,
        maxScore: submission.validationResult.maxScore,
        explanation: submission.validationResult.explanation,
        feedback: submission.validationResult,
        validatedAt: submission.validatedAt,
      };

      client.emit('answer-validated', answerValidated);

      // Update leaderboard
      if (metadata.questionnaireId) {
        await this.broadcastLeaderboard(metadata.questionnaireId);
      }

      return {
        success: true,
        message: 'Answer submitted successfully',
        submission: {
          id: submission.id,
          validationStatus: submission.validationStatus,
          score: submission.validationResult.score,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error submitting answer: ${error.message}`,
        error.stack,
      );
      throw new WsException(error.message || 'Failed to submit answer');
    }
  }

  /**
   * Handle moving to next question
   */
  @SubscribeMessage('next-question')
  async handleNextQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: NextQuestionDto,
  ) {
    try {
      const metadata = this.clients.get(client.id);
      if (!metadata || !metadata.questionnaireId) {
        throw new WsException('Not in a quiz session');
      }

      this.logger.log(
        `User ${metadata.userName} moving to next question`,
      );

      const session = this.sessions.get(metadata.questionnaireId);
      if (session) {
        // Update current question for this attempt
        if (data.nextQuestionId) {
          session.currentQuestion.set(data.attemptId, data.nextQuestionId);
        }
        session.lastActivity = new Date();
      }

      // Get attempt to determine question details
      const attempt = await this.answerService.getAttempt(
        data.attemptId,
        metadata.userId,
      );

      // Get questions for the questionnaire
      const questions = await this.questionnaireService.getQuestions(
        attempt.questionnaire_id,
      );
      const currentIndex = questions.findIndex(
        (q) => q.id === data.nextQuestionId,
      );

      // Emit question update to the client
      const questionUpdate: QuestionUpdateDto = {
        attemptId: data.attemptId,
        questionId: data.nextQuestionId,
        questionIndex: currentIndex,
        totalQuestions: questions.length,
        questionData: data.nextQuestionId
          ? questions[currentIndex]
          : null,
        isLastQuestion: currentIndex === questions.length - 1,
      };

      client.emit('question-update', questionUpdate);

      // Emit quiz state update
      const quizUpdate: QuizUpdateDto = {
        attemptId: data.attemptId,
        questionnaireId: metadata.questionnaireId,
        status: 'in-progress',
        currentQuestionIndex: currentIndex,
        questionsAnswered: attempt.submissions?.length || 0,
        currentScore: attempt.score || 0,
        updatedAt: new Date(),
      };

      client.emit('quiz-update', quizUpdate);

      return {
        success: true,
        message: 'Moved to next question',
        questionIndex: currentIndex,
      };
    } catch (error) {
      this.logger.error(
        `Error moving to next question: ${error.message}`,
        error.stack,
      );
      throw new WsException(
        error.message || 'Failed to move to next question',
      );
    }
  }

  /**
   * Handle quiz completion
   */
  @SubscribeMessage('quiz-complete')
  async handleQuizComplete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: QuizCompleteDto,
  ) {
    try {
      const metadata = this.clients.get(client.id);
      if (!metadata) {
        throw new WsException('Client not authenticated');
      }

      this.logger.log(
        `User ${metadata.userName} completing quiz (attempt ${data.attemptId})`,
      );

      // Complete the questionnaire
      const attempt = await this.answerService.completeQuestionnaire(
        metadata.userId,
        data.attemptId,
        data,
      );

      // Emit quiz ended event
      const quizEnded: QuizEndedDto = {
        attemptId: attempt.id,
        questionnaireId: attempt.questionnaire.id,
        userId: metadata.userId,
        userName: metadata.userName,
        score: attempt.score,
        percentage: attempt.percentage,
        timeSpent: attempt.timeSpent,
        result: attempt.result,
        feedback: attempt.feedback,
        completedAt: attempt.completedAt,
      };

      client.emit('quiz-ended', quizEnded);

      // Broadcast to room if in a session
      if (metadata.questionnaireId) {
        const roomName = `quiz-${metadata.questionnaireId}`;
        this.server.to(roomName).emit('participant-completed', quizEnded);

        // Update leaderboard
        await this.broadcastLeaderboard(metadata.questionnaireId);

        // Update session stats
        await this.broadcastSessionStats(metadata.questionnaireId);
      }

      return {
        success: true,
        message: 'Quiz completed successfully',
        result: {
          score: attempt.score,
          percentage: attempt.percentage,
          result: attempt.result,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error completing quiz: ${error.message}`,
        error.stack,
      );
      throw new WsException(error.message || 'Failed to complete quiz');
    }
  }

  /**
   * Handle get leaderboard request
   */
  @SubscribeMessage('get-leaderboard')
  async handleGetLeaderboard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GetLeaderboardDto,
  ) {
    try {
      const metadata = this.clients.get(client.id);
      if (!metadata) {
        throw new WsException('Client not authenticated');
      }

      this.logger.log(
        `User ${metadata.userName} requesting leaderboard for questionnaire ${data.questionnaireId}`,
      );

      const leaderboard = await this.getLeaderboard(
        data.questionnaireId,
        data.limit || 10,
        metadata.userId,
      );

      client.emit('leaderboard-update', leaderboard);

      return {
        success: true,
        message: 'Leaderboard retrieved successfully',
      };
    } catch (error) {
      this.logger.error(
        `Error getting leaderboard: ${error.message}`,
        error.stack,
      );
      throw new WsException(error.message || 'Failed to get leaderboard');
    }
  }

  /**
   * Broadcast leaderboard update to all participants in a quiz room
   */
  private async broadcastLeaderboard(
    questionnaireId: number,
    limit: number = 10,
  ) {
    try {
      const leaderboard = await this.getLeaderboard(questionnaireId, limit);
      const roomName = `quiz-${questionnaireId}`;
      this.server.to(roomName).emit('leaderboard-update', leaderboard);
    } catch (error) {
      this.logger.error(
        `Error broadcasting leaderboard: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get leaderboard for a questionnaire
   */
  private async getLeaderboard(
    questionnaireId: number,
    limit: number = 10,
    currentUserId?: number,
  ): Promise<LeaderboardDto> {
    // Get completed attempts for this questionnaire, sorted by score and time
    const attempts = await this.answerService.getQuestionnaireAttempts(
      questionnaireId,
      {
        status: AttemptStatus.Completed,
        sortBy: 'score',
        sortOrder: 'DESC',
        limit: 100, // Get more to calculate ranks properly
        includeUser: true,
      },
    );

    // Create leaderboard entries
    const entries: LeaderboardEntry[] = [];
    let rank = 1;
    let currentUserRank: number | undefined;

    for (let i = 0; i < Math.min(attempts.data.length, limit); i++) {
      const attempt = attempts.data[i];
      const isCurrentUser = currentUserId === attempt.user.id;

      const entry: LeaderboardEntry = {
        userId: attempt.user.id,
        userName: `${attempt.user.firstName} ${attempt.user.lastName}`,
        score: attempt.score || 0,
        percentage: attempt.percentage || 0,
        timeSpent: attempt.timeSpent || 0,
        completedAt: attempt.completedAt,
        rank,
        isCurrentUser,
      };

      entries.push(entry);

      if (isCurrentUser) {
        currentUserRank = rank;
      }

      rank++;
    }

    // If current user is not in top entries, find their rank
    if (currentUserId && !currentUserRank) {
      const userAttemptIndex = attempts.data.findIndex(
        (a) => a.user.id === currentUserId,
      );
      if (userAttemptIndex !== -1) {
        currentUserRank = userAttemptIndex + 1;
      }
    }

    // Count active participants (in current session)
    const session = this.sessions.get(questionnaireId);
    const activeParticipants = session ? session.participants.size : 0;

    return {
      questionnaireId,
      entries,
      totalParticipants: attempts.meta.total,
      currentUserRank,
      activeParticipants,
      updatedAt: new Date(),
    };
  }

  /**
   * Broadcast session statistics to all participants
   */
  private async broadcastSessionStats(questionnaireId: number) {
    try {
      const session = this.sessions.get(questionnaireId);
      if (!session) return;

      // Get completed attempts count
      const completedAttempts = await this.answerService.getQuestionnaireAttempts(
        questionnaireId,
        {
          status: AttemptStatus.Completed,
          limit: 1000,
        },
      );

      // Calculate average score from completed attempts
      let averageScore = 0;
      let averageTimeSpent = 0;

      if (completedAttempts.data.length > 0) {
        const totalScore = completedAttempts.data.reduce(
          (sum, attempt) => sum + (attempt.score || 0),
          0,
        );
        const totalTime = completedAttempts.data.reduce(
          (sum, attempt) => sum + (attempt.timeSpent || 0),
          0,
        );

        averageScore = totalScore / completedAttempts.data.length;
        averageTimeSpent = totalTime / completedAttempts.data.length;
      }

      const stats: QuizSessionStatsDto = {
        questionnaireId,
        activeParticipants: session.participants.size,
        totalParticipants: completedAttempts.meta.total,
        completedParticipants: completedAttempts.data.length,
        averageScore,
        averageTimeSpent,
        updatedAt: new Date(),
      };

      const roomName = `quiz-${questionnaireId}`;
      this.server.to(roomName).emit('session-stats', stats);
    } catch (error) {
      this.logger.error(
        `Error broadcasting session stats: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Extract JWT token from socket handshake
   */
  private extractToken(client: Socket): string | null {
    const token =
      client.handshake.auth.token ||
      client.handshake.headers.authorization?.replace('Bearer ', '') ||
      client.handshake.query.token;

    return token || null;
  }

  /**
   * Verify JWT token
   */
  private async verifyToken(token: string): Promise<any> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      return payload;
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error.message}`);
      return null;
    }
  }
}
