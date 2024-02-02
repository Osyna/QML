import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionModule } from './question/question.module';
import { Question, QuestionPool, Questionnaire } from './question/question.entity';

// @Module({
//   imports: [],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}




@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './database/qml_database.db', // Make sure this path is correct
      entities: [Question,QuestionPool,Questionnaire],
      synchronize: true, // Caution: set to false in production
    }),
    QuestionModule,
  ],
  // other configurations
})
export class AppModule {}