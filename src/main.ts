import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || '*',
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Global validation pipe with transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted values are provided
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('QML API')
    .setDescription(
      `Question Markup Language API - A comprehensive questionnaire and assessment platform.

      ## Features
      - Multiple question types (MCQ, Free-Text, Rating, etc.)
      - AI-powered answer validation
      - Adaptive questionnaire paths
      - Real-time analytics and reporting
      - Question versioning and history
      - User authentication and authorization

      ## Authentication
      Most endpoints require Bearer token authentication. Use the /auth/login endpoint to obtain a token.`,
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Questions', 'Question CRUD and management')
    .addTag('Question Pools', 'Question pool management')
    .addTag('Questionnaires', 'Questionnaire management')
    .addTag('Answers', 'Answer submission and attempt management')
    .addTag('Analytics', 'Analytics and reporting endpoints')
    .addTag('AI', 'AI-powered features and services')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 QML API Server is running!                          ║
║                                                           ║
║   📍 Server URL:     http://localhost:${port}                 ║
║   📚 API Docs:       http://localhost:${port}/api/docs        ║
║   🔧 Environment:    ${configService.get('NODE_ENV') || 'development'}                   ║
║   🗄️  Database:      ${configService.get('DB_TYPE') || 'sqlite'}                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
