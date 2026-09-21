import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/database.module';
import { RedisModule } from '../redis/redis.module';
import { AuthSessionService } from './auth-session.service';
import { CognitoUserService } from './cognito-user.service';
import { AuthController } from './auth.controller';
import { CognitoOAuthService } from './cognito-oauth.service';
import { OAuthTransactionService } from './oauth-transaction.service';

@Module({
  controllers: [AuthController],
  imports: [DatabaseModule, RedisModule],
  providers: [
    AuthSessionService,
    CognitoOAuthService,
    CognitoUserService,
    OAuthTransactionService,
  ],
  exports: [CognitoUserService, AuthSessionService],
})
export class AuthModule { }

