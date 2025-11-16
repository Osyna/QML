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
  console.log(`Available endpoints:`);
  console.log(`  - POST   /questions`);
  console.log(`  - GET    /questions`);
  console.log(`  - GET    /questions/:id`);
  console.log(`  - PATCH  /questions/:id`);
  console.log(`  - DELETE /questions/:id`);
  console.log(`  - POST   /question-pools`);
  console.log(`  - GET    /question-pools`);
  console.log(`  - GET    /question-pools/:id`);
  console.log(`  - PATCH  /question-pools/:id`);
  console.log(`  - DELETE /question-pools/:id`);
  console.log(`  - POST   /questionnaires`);
  console.log(`  - GET    /questionnaires`);
  console.log(`  - GET    /questionnaires/:id`);
  console.log(`  - PATCH  /questionnaires/:id`);
  console.log(`  - DELETE /questionnaires/:id`);
  console.log(`  - GET    /questionnaires/:id/next-question`);
  console.log(`  - POST   /answers`);
  console.log(`  - GET    /answers`);
  console.log(`  - GET    /answers/:id`);
}
bootstrap();
