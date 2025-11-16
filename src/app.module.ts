import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { QuestionModule } from './question/question.module';
import { QuestionPoolModule } from './question-pool/question-pool.module';
import { QuestionnaireModule } from './questionnaire/questionnaire.module';
import { AnswerModule } from './answer/answer.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AIModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { WebsocketModule } from './websocket/websocket.module';
import { ImportExportModule } from './import-export/import-export.module';
import { Question } from './question/entities/question.entity';
import { QuestionPool } from './question-pool/entities/question-pool.entity';
import { Questionnaire } from './questionnaire/entities/questionnaire.entity';
import { User } from './users/entities/user.entity';
import { QuestionnaireAttempt } from './answer/entities/questionnaire-attempt.entity';
import { AnswerSubmission } from './answer/entities/answer-submission.entity';
import { QuestionVersion } from './versioning/entities/question-version.entity';
import configuration, { validationSchema } from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './database/qml_database.db',
      entities: [
        User,
        Question,
        QuestionPool,
        Questionnaire,
        QuestionnaireAttempt,
        AnswerSubmission,
        QuestionVersion,
      ],
      synchronize: true, // Caution: set to false in production
    }),
    AuthModule,
    UsersModule,
    QuestionModule,
    QuestionPoolModule,
    QuestionnaireModule,
    AnswerModule,
    AIModule,
    AnalyticsModule,
    WebsocketModule,
    ImportExportModule,
  ],
})
export class AppModule {}