import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Answer } from './entities/answer.entity';
import { Question } from '../question/entities/question.entity';
import { AnswerController } from './answer.controller';
import { AnswerService } from './answer.service';
import { AnswerValidationService } from './answer-validation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Answer, Question])],
  controllers: [AnswerController],
  providers: [AnswerService, AnswerValidationService],
  exports: [AnswerService, AnswerValidationService],
})
export class AnswerModule {}
