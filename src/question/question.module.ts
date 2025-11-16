import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { QuestionPool } from './entities/question-pool.entity';
import { Questionnaire } from './entities/questionnaire.entity';
import { QuestionController } from './question.controller';
import { QuestionPoolController } from './question-pool.controller';
import { QuestionnaireController } from './questionnaire.controller';
import { QuestionService } from './question.service';
import { QuestionPoolService } from './question-pool.service';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionSelectionService } from './question-selection.service';

@Module({
  imports: [TypeOrmModule.forFeature([Question, QuestionPool, Questionnaire])],
  controllers: [QuestionController, QuestionPoolController, QuestionnaireController],
  providers: [
    QuestionService,
    QuestionPoolService,
    QuestionnaireService,
    QuestionSelectionService,
  ],
  exports: [
    QuestionService,
    QuestionPoolService,
    QuestionnaireService,
    QuestionSelectionService,
  ],
})
export class QuestionModule {}
