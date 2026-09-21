import { BadRequestException, Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { setSessionCookie } from './auth.cookie';
import { AuthSessionService } from './auth-session.service';
import { CognitoOAuthService } from './cognito-oauth.service';
import { CognitoUserService } from './cognito-user.service';
import { OAuthTransactionService } from './oauth-transaction.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly oauthTransactions: OAuthTransactionService,
    private readonly cognitoOAuth: CognitoOAuthService,
    private readonly cognitoUsers: CognitoUserService,
    private readonly authSessions: AuthSessionService,
  ) {}

  @Get('login')
  async login(
    @Query('app') app: string | undefined,
    @Query('provider') provider: string | undefined,
    @Query('returnTo') returnTo: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const authorizeUrl = await this.oauthTransactions.begin(app, provider, returnTo);
    response.redirect(authorizeUrl);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') oauthError: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const transaction = await this.oauthTransactions.consume(state);

    if (oauthError) {
      throw new BadRequestException(`OAuth login failed: ${oauthError}`);
    }

    const login = await this.cognitoOAuth.exchangeCode(code, transaction.nonce);
    const userId = await this.cognitoUsers.syncUser(login.profile);
    const session = await this.authSessions.createSession(userId, login.refreshToken);

    // Only LastBite's opaque session token reaches the browser. Cognito tokens
    // remain encrypted/server-side and are never returned to the frontend.
    setSessionCookie(response, session.token, session.expiresAt);
    response.redirect(transaction.returnTo);
  }
}
