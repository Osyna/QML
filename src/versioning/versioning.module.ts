import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionVersion } from './entities/question-version.entity';
import { Question } from '../question/entities/question.entity';
import { VersioningService } from './versioning.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionVersion, Question]),
  ],
  providers: [VersioningService],
  exports: [VersioningService],
})
export class VersioningModule {}
