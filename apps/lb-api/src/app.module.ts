import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import type { Request, Response } from 'express';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { AuthModule } from './auth/auth.module';
import { HealthResolver } from './health/health.resolver';
import { StoreModule } from './store/store.module';
import { MediaModule } from './media/media.module';
import { PostModule } from './post/post.module';
import { isProduction, ValidationExceptionFilter } from './common';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    StoreModule,
    MediaModule,
    PostModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: !isProduction(),
      // AuthGuard needs the response to rotate the session cookie, so pass both.
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
    }),
  ],
  controllers: [AppController],
  providers: [HealthResolver, { provide: APP_FILTER, useClass: ValidationExceptionFilter }],
})
export class AppModule {}
