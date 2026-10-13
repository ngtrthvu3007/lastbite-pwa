import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/database.module';
import { RedisModule } from '../redis/redis.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CognitoOAuthService } from './oauth/cognito-oauth.service';
import { AUTH_CONFIG, createAuthConfig } from './auth.config';
import { OAuthTransactionService } from './oauth/oauth-transaction.service';
import { AuthSessionService } from './session/auth-session.service';
import { UserService } from './user.service';

@Module({
  controllers: [AuthController],
  imports: [DatabaseModule, RedisModule],
  providers: [
    { provide: AUTH_CONFIG, useFactory: createAuthConfig },
    OAuthTransactionService,
    CognitoOAuthService,
    UserService,
    AuthSessionService,
    AuthGuard,
    AuthService,
  ],
})
export class AuthModule {}
