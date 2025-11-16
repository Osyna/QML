import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for development
  app.enableCors();

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`QML API is running on: http://localhost:${port}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`\n--- Questions ---`);
  console.log(`  POST   /questions`);
  console.log(`  GET    /questions`);
  console.log(`  GET    /questions/:id`);
  console.log(`  PATCH  /questions/:id`);
  console.log(`  DELETE /questions/:id`);
  console.log(`\n--- Question Pools ---`);
  console.log(`  POST   /question-pools`);
  console.log(`  GET    /question-pools`);
  console.log(`  GET    /question-pools/:id`);
  console.log(`  PATCH  /question-pools/:id`);
  console.log(`  DELETE /question-pools/:id`);
  console.log(`  POST   /question-pools/:id/questions`);
  console.log(`  DELETE /question-pools/:id/questions`);
  console.log(`\n--- Questionnaires ---`);
  console.log(`  POST   /questionnaires`);
  console.log(`  GET    /questionnaires`);
  console.log(`  GET    /questionnaires/:id`);
  console.log(`  PATCH  /questionnaires/:id`);
  console.log(`  DELETE /questionnaires/:id`);
  console.log(`  GET    /questionnaires/:id/next-question`);
  console.log(`\n--- Answers (Individual) ---`);
  console.log(`  POST   /answers`);
  console.log(`  GET    /answers`);
  console.log(`  GET    /answers/:id`);
  console.log(`  GET    /answers/question/:questionId`);
  console.log(`  GET    /answers/questionnaire/:questionnaireId`);
  console.log(`\n--- Sessions (Batch/Complete Questionnaires) ---`);
  console.log(`  POST   /sessions`);
  console.log(`  GET    /sessions/:id`);
  console.log(`  POST   /sessions/:id/submit`);
  console.log(`  GET    /sessions/:id/results`);
  console.log(`  GET    /sessions/user/:userId`);
  console.log(`  GET    /sessions/questionnaire/:questionnaireId`);
}
bootstrap();
