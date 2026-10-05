import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/database.module';
import { RedisModule } from '../redis/redis.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CognitoOAuthService } from './cognito/cognito-oauth.service';
import { CognitoUserService } from './cognito/cognito-user.service';
import { AUTH_CONFIG, createAuthConfig } from './auth.config';
import { OAuthTransactionService } from './oauth/oauth-transaction.service';
import { AuthSessionService } from './session/auth-session.service';

@Module({
  controllers: [AuthController],
  imports: [DatabaseModule, RedisModule],
  providers: [
    { provide: AUTH_CONFIG, useFactory: createAuthConfig },
    OAuthTransactionService,
    CognitoOAuthService,
    CognitoUserService,
    AuthSessionService,
    AuthGuard,
    AuthService,
  ],
})
export class AuthModule {}
