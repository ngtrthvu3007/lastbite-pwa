import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AUTH_COOKIE_NAME } from './auth/auth.constants';
import { buildValidationError, isProduction } from './common';
import { getRequiredEnv } from './common/get-required-env';

const DEFAULT_PORT = 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || DEFAULT_PORT;
  const webAppOrigin = new URL(getRequiredEnv('APP_URL')).origin;

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      exceptionFactory: buildValidationError,
    }),
  );
  app.enableCors({ credentials: true, origin: webAppOrigin });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('LastBite API')
    .setDescription('LastBite backend API')
    .setVersion('0.1.0')
    .addCookieAuth(AUTH_COOKIE_NAME, undefined, AUTH_COOKIE_NAME)
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(port);

  if (!isProduction()) {
    Logger.log(`GraphQL Playground: http://localhost:${port}/graphql`, 'Bootstrap');
    Logger.log(`REST Swagger: http://localhost:${port}/api/docs`, 'Bootstrap');
  }
}
bootstrap();
