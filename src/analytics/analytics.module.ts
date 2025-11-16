import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { QuestionnaireAttempt } from '../answer/entities/questionnaire-attempt.entity';
import { AnswerSubmission } from '../answer/entities/answer-submission.entity';
import { Question } from '../question/entities/question.entity';
import { Questionnaire } from '../questionnaire/entities/questionnaire.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuestionnaireAttempt,
      AnswerSubmission,
      Question,
      Questionnaire,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
