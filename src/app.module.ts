import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionModule } from './question/question.module';
import { AnswerModule } from './answer/answer.module';
import { Question } from './question/entities/question.entity';
import { QuestionPool } from './question/entities/question-pool.entity';
import { Questionnaire } from './question/entities/questionnaire.entity';
import { Answer } from './answer/entities/answer.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './database/qml_database.db',
      entities: [Question, QuestionPool, Questionnaire, Answer],
      synchronize: true, // Set to false in production
      logging: false,
    }),
    QuestionModule,
    AnswerModule,
  ],
})
export class AppModule {}
