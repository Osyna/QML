import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswerController } from './answer.controller';
import { AnswerService } from './answer.service';
import { QuestionnaireAttempt } from './entities/questionnaire-attempt.entity';
import { AnswerSubmission } from './entities/answer-submission.entity';
import { QuestionnaireModule } from '../questionnaire/questionnaire.module';
import { QuestionModule } from '../question/question.module';
import { AIModule } from '../ai/ai.module';

/**
 * Answer Module
 * Handles questionnaire attempts and answer submissions
 *
 * Features:
 * - Starting and completing questionnaire attempts
 * - Submitting and validating answers
 * - Multiple validation strategies (exact, keywords, AI, manual)
 * - Automatic scoring and feedback generation
 * - Manual review by educators
 * - Comprehensive filtering and querying
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionnaireAttempt, AnswerSubmission]),
    QuestionnaireModule,
    QuestionModule,
    AIModule,
  ],
  controllers: [AnswerController],
  providers: [AnswerService],
  exports: [AnswerService],
})
export class AnswerModule {}
