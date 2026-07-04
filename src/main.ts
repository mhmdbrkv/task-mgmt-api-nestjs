import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get the configuration service
  const config = app.get(ConfigService);
  const port = config.get<number>('port') ?? 3000;

  app.setGlobalPrefix('api');

  await app.listen(port);

  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
}
bootstrap();
