import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { HealthResolver } from './health/health.resolver';
import { AuthModule } from './auth/auth.module';
import { getSessionToken } from './auth/auth.cookie';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [AuthModule],
      inject: [AuthService],
      useFactory: (auth: AuthService) => ({
        autoSchemaFile: true,
        playground: process.env.APP_ENV !== 'production',
        context: async ({ req }) => ({
          req,
          currentUser: await auth.getCurrentUser(getSessionToken(req.headers.cookie)),
        }),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService, HealthResolver],
})
export class AppModule {}
