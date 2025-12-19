import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import helmet from 'helmet';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { ValidationErrorUtil } from './common/utils/validation-error.util';
import { API_PREFIX, API_VERSION, ROUTES } from './common/constants';
import { createSuperAdmin } from './database/seeds/create-super-admin.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Create super admin on startup
  try {
    const dataSource = app.get(DataSource);
    await createSuperAdmin(dataSource);
  } catch (error) {
    console.error('⚠️  Failed to create super admin:', error.message);
  }

  // Increase body limit for Base64 images
  app.use(bodyParser.json({ limit: '20mb' }));
  app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));

  // Security middleware
  if (configService.get('app.security.helmetEnabled')) {
    app.use(helmet());
  }

  // Compression middleware
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: configService.get('app.cors.origin'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe with custom exception factory for better error formatting
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Skip validation for undefined/null values and custom decorators
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false,
      exceptionFactory: errors => {
        const formattedErrors = ValidationErrorUtil.format(errors);

        return new BadRequestException({
          message: formattedErrors.message,
          errors: formattedErrors.errors,
          errorCount: formattedErrors.errorCount,
        });
      },
    }),
  );

  // API versioning
  app.setGlobalPrefix(API_PREFIX);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('SaaS Backend API')
    .setDescription('Production-ready SaaS backend boilerplate with NestJS')
    .setVersion(API_VERSION)

    // Access Token (Bearer)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter Access Token: Bearer <token>',
        in: 'header',
      },
      'bearer',
    )

    // Refresh Token (Custom Header)
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'Enter Refresh Token: Refresh <token>',
      },
      'refresh-token',
    )

    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${API_PREFIX}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('app.port') || 8080;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/${API_PREFIX}/docs`);
  console.log(`🏥 Health check: http://localhost:${port}/${API_PREFIX}/${ROUTES.HEALTH.BASE}`);
}

bootstrap();
