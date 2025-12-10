import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import express, { Request, Response } from 'express';
import { INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Define bootstrap function that can be used for both local and serverless
async function bootstrap(): Promise<INestApplication> {
  const expressApp = express(); // Create an Express instance
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  // Enable CORS
  app.enableCors();

  // Use class-validator for all incoming requests
  app.useGlobalPipes(new ValidationPipe());

  // Apply the custom exception filter globally
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init(); // Initialize NestJS modules
  return app;
}

// Local development entry point
async function localBootstrap() {
  const app = await bootstrap();
  const port = process.env.PORT || 3000; // Use port 3000 by default or environment variable
  await app.listen(port, () => {
    console.log(`Application is running on: http://localhost:${port}`);
  });
}

// Vercel serverless function handler
let cachedApp: INestApplication;
export default async function (req: Request, res: Response) {
  if (!cachedApp) {
    cachedApp = await bootstrap(); // Use the common bootstrap function
  }
  return cachedApp.getHttpAdapter().getInstance()(req, res);
}

// Determine if we are running locally (not in Vercel environment)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV) {
  localBootstrap();
}