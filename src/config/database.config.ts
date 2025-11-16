import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Question } from '../question/entities/question.entity';
import { QuestionPool } from '../question-pool/entities/question-pool.entity';
import { Questionnaire } from '../questionnaire/entities/questionnaire.entity';
import { QuestionnaireAttempt } from '../answer/entities/questionnaire-attempt.entity';
import { AnswerSubmission } from '../answer/entities/answer-submission.entity';
import { QuestionVersion } from '../versioning/entities/question-version.entity';

/**
 * Database configuration factory
 * Supports SQLite and PostgreSQL based on environment configuration
 */
export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbType = configService.get<string>('database.type', 'sqlite');

  const commonConfig = {
    entities: [
      User,
      Question,
      QuestionPool,
      Questionnaire,
      QuestionnaireAttempt,
      AnswerSubmission,
      QuestionVersion,
    ],
    synchronize: configService.get<boolean>('database.synchronize', true),
    logging: configService.get<boolean>('database.logging', false),
  };

  if (dbType === 'postgres' || dbType === 'postgresql') {
    return {
      ...commonConfig,
      type: 'postgres',
      host: configService.get<string>('database.host', 'localhost'),
      port: configService.get<number>('database.port', 5432),
      username: configService.get<string>('database.username', 'postgres'),
      password: configService.get<string>('database.password', ''),
      database: configService.get<string>('database.database', 'qml_db'),
      ssl: configService.get<boolean>('database.ssl', false)
        ? { rejectUnauthorized: false }
        : false,
      extra: {
        max: configService.get<number>('database.poolSize', 10),
        connectionTimeoutMillis: configService.get<number>(
          'database.connectionTimeout',
          5000,
        ),
      },
    } as TypeOrmModuleOptions;
  }

  // Default to SQLite
  return {
    ...commonConfig,
    type: 'sqlite',
    database: configService.get<string>(
      'database.database',
      './database/qml_database.db',
    ),
  } as TypeOrmModuleOptions;
};
