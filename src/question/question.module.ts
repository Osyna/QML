import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { QuestionVersion } from '../versioning/entities/question-version.entity';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { UsersModule } from '../users/users.module';
import { VersioningModule } from '../versioning/versioning.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, QuestionVersion]),
    UsersModule,
    VersioningModule,
  ],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}
