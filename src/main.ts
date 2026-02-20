import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
app.enableCors({
  origin: (origin, callback) => {
    if (
      !origin ||
      origin.includes('vercel.app') ||
      origin.includes('localhost')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
});
  
  app.setGlobalPrefix('api/v1');
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  const port = configService.get('PORT') || 3001;
  await app.listen(port);
  
  console.log(`🚀 Backend running on http://localhost:${port}/api/v1`);
  console.log(`📁 Environment: ${configService.get('NODE_ENV')}`);
  console.log(`🗄️  Database: ${configService.get('DB_NAME')} @ ${configService.get('DB_HOST')}:${configService.get('DB_PORT')}`);
}
bootstrap();