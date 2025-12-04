import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { INestApplication } from '@nestjs/common';

let cachedApp: INestApplication; // Cache the app instance for cold starts

async function bootstrapServer(): Promise<INestApplication> {
  const expressApp = express(); // Create an Express instance
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  // Enable CORS
  app.enableCors();

  // Use class-validator for all incoming requests
  app.useGlobalPipes(new ValidationPipe());

  // Apply JwtAuthGuard globally
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  await app.init(); // Initialize NestJS modules
  return app;
}

// This is the Vercel serverless function handler
export default async function (req, res) {
  if (!cachedApp) {
    cachedApp = await bootstrapServer();
  }
  // Use the underlying httpAdapter to process the request
  // This ensures NestJS's routing takes over
  return cachedApp.getHttpAdapter().getInstance()(req, res);
}