import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QuizGateway } from './quiz.gateway';
import { AnswerModule } from '../answer/answer.module';
import { QuestionnaireModule } from '../questionnaire/questionnaire.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

/**
 * WebSocket Module
 *
 * Provides real-time communication for quiz sessions using Socket.IO
 *
 * Features:
 * - Real-time quiz participation
 * - Live leaderboards
 * - Instant answer validation
 * - Question progression synchronization
 * - Participant tracking
 * - JWT authentication for WebSocket connections
 *
 * Gateways:
 * - QuizGateway: Handles all quiz-related WebSocket events
 *
 * Dependencies:
 * - AnswerModule: For answer submission and validation
 * - QuestionnaireModule: For questionnaire data and logic
 * - UsersModule: For user authentication and data
 * - AuthModule: For JWT authentication
 */
@Module({
  imports: [
    // Import required modules
    AnswerModule,
    QuestionnaireModule,
    UsersModule,
    AuthModule,
    // JWT configuration for WebSocket authentication
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') || '24h',
        },
      }),
    }),
  ],
  providers: [QuizGateway],
  exports: [QuizGateway],
})
export class WebsocketModule {}
