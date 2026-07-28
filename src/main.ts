import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

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

  // Start the server
  await app.listen(port);

  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
}
bootstrap();
