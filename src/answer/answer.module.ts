import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Answer } from './entities/answer.entity';
import { QuestionnaireSession } from './entities/questionnaire-session.entity';
import { AnswerController } from './answer.controller';
import { QuestionnaireSessionController } from './questionnaire-session.controller';
import { AnswerService } from './answer.service';
import { AnswerValidationService } from './answer-validation.service';
import { QuestionnaireSessionService } from './questionnaire-session.service';
import { QuestionModule } from '../question/question.module';

@Module({
  imports: [TypeOrmModule.forFeature([Answer, QuestionnaireSession]), QuestionModule],
  controllers: [AnswerController, QuestionnaireSessionController],
  providers: [AnswerService, AnswerValidationService, QuestionnaireSessionService],
  exports: [AnswerService, AnswerValidationService, QuestionnaireSessionService],
})
export class AnswerModule {}
