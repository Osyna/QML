import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionModule } from './question/question.module';
import { AnswerModule } from './answer/answer.module';
import { Question } from './question/entities/question.entity';
import { QuestionPool } from './question/entities/question-pool.entity';
import { Questionnaire } from './question/entities/questionnaire.entity';
import { Answer } from './answer/entities/answer.entity';
import { QuestionnaireSession } from './answer/entities/questionnaire-session.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get('DB_TYPE', 'sqlite');

        const entities = [Question, QuestionPool, Questionnaire, Answer, QuestionnaireSession];

        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 5432),
            username: configService.get('DB_USERNAME', 'qml_user'),
            password: configService.get('DB_PASSWORD', 'qml_password'),
            database: configService.get('DB_DATABASE', 'qml_db'),
            entities,
            synchronize: configService.get('DB_SYNCHRONIZE', 'true') === 'true',
            logging: configService.get('DB_LOGGING', 'false') === 'true',
          };
        }

        // Default to SQLite
        return {
          type: 'sqlite',
          database: configService.get('DB_SQLITE_PATH', './database/qml_database.db'),
          entities,
          synchronize: configService.get('DB_SYNCHRONIZE', 'true') === 'true',
          logging: configService.get('DB_LOGGING', 'false') === 'true',
        };
      },
    }),
    QuestionModule,
    AnswerModule,
  ],
})
export class AppModule {}
