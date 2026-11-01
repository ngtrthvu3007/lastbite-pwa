import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import type { Request, Response } from 'express';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { AuthModule } from './auth/auth.module';
import { HealthResolver } from './health/health.resolver';
import { isProduction } from './common';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: !isProduction(),
      // AuthGuard needs the response to rotate the session cookie, so pass both.
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
    }),
  ],
  controllers: [AppController],
  providers: [HealthResolver],
})
export class AppModule {}
