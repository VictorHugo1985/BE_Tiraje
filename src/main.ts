import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

const server = express(); // Use 'server' to align with NestJS examples for adapter

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  // Enable CORS
  app.enableCors();

  // Use class-validator for all incoming requests
  app.useGlobalPipes(new ValidationPipe());

  // Apply JwtAuthGuard globally
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  await app.init(); // Initialize NestJS modules
  // No app.listen() here
}
bootstrap(); // Call bootstrap to initialize the app

// Export the underlying Express server instance
export default server;
