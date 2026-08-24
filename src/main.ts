import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from './utils/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix
  app.setGlobalPrefix('api');

  // Get the configuration service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;

  // Configure Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Task Management System API')
    .setDescription('API documentation for task management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Enable CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Apply validation pipe globally
  app.useGlobalPipes(new ValidationPipe());

  // Apply interceptor globally
  app.useGlobalInterceptors(new TransformInterceptor());

  // Start the server
  await app.listen(port);

  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
}
bootstrap();
