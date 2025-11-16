import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionnaireController } from './questionnaire.controller';
import { QuestionnaireService } from './questionnaire.service';
import { PathLogicService } from './path-logic.service';
import { Questionnaire } from './entities/questionnaire.entity';
import { Question } from '../question/entities/question.entity';
import { QuestionnaireAttempt } from '../answer/entities/questionnaire-attempt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Questionnaire, Question, QuestionnaireAttempt]),
  ],
  controllers: [QuestionnaireController],
  providers: [QuestionnaireService, PathLogicService],
  exports: [QuestionnaireService, PathLogicService],
})
export class QuestionnaireModule {}
