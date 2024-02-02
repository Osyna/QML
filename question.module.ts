import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question,QuestionPool,Questionnaire } from './question.entity';
import { QuestionController, QuestionPoolController, QuestionnaireController } from './question.controller';
import { QuestionService, QuestionPoolService, QuestionnaireService } from './question.service';

@Module({
  imports: [TypeOrmModule.forFeature([Question]),TypeOrmModule.forFeature([QuestionPool]),TypeOrmModule.forFeature([Questionnaire])],
  controllers: [QuestionController,QuestionPoolController,QuestionnaireController],
  providers: [QuestionService, QuestionPoolService, QuestionnaireService],
})
export class QuestionModule {}