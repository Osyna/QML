import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionPoolController } from './question-pool.controller';
import { QuestionPoolService } from './question-pool.service';
import { QuestionPool } from './entities/question-pool.entity';
import { Question } from '../question/entities/question.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionPool, Question]),
  ],
  controllers: [QuestionPoolController],
  providers: [QuestionPoolService],
  exports: [QuestionPoolService],
})
export class QuestionPoolModule {}
