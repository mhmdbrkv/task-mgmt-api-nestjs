import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from './utils/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get the configuration service
  const config = app.get(ConfigService);
  const port = config.get<number>('port') ?? 3000;

  // Enable CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix('api');

  // Apply validation pipe globally
  app.useGlobalPipes(new ValidationPipe());

  // Apply interceptor globally
  app.useGlobalInterceptors(new TransformInterceptor());

  // Start the server
  await app.listen(port);

  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
}
bootstrap();
