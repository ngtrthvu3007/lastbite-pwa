import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthSessionService, CreatedSession } from './auth-session.service';
import { CognitoOAuthService } from './cognito-oauth.service';
import { CognitoUserService } from './cognito-user.service';
import { CurrentUserDto } from './dto/current-user.dto';
import { OAuthTransactionService } from './oauth-transaction.service';

export interface CompletedLogin extends CreatedSession {
  returnTo: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly oauthTransactions: OAuthTransactionService,
    private readonly cognitoOAuth: CognitoOAuthService,
    private readonly cognitoUsers: CognitoUserService,
    private readonly authSessions: AuthSessionService,
  ) {}

  async beginLogin(
    app: string | undefined,
    provider: string | undefined,
    returnTo: string | undefined,
  ): Promise<string> {
    return this.oauthTransactions.begin(app, provider, returnTo);
  }

  async completeLogin(
    code: string | undefined,
    state: string | undefined,
    oauthError: string | undefined,
  ): Promise<CompletedLogin> {
    const transaction = await this.oauthTransactions.consume(state);

    if (oauthError) {
      throw new BadRequestException(`OAuth login failed: ${oauthError}`);
    }

    const login = await this.cognitoOAuth.exchangeCode(code, transaction.nonce);
    const userId = await this.cognitoUsers.syncUser(login.profile);
    const session = await this.authSessions.createSession(userId, login.refreshToken);

    return { ...session, returnTo: transaction.returnTo };
  }

  async getCurrentUser(token: string | undefined): Promise<CurrentUserDto | null> {
    return this.authSessions.getCurrentUser(token);
  }

  async logout(token: string | undefined): Promise<void> {
    await this.authSessions.revokeSession(token);
  }
}
