import { Controller, Get, Headers, HttpCode, Post, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  AUTH_COOKIE_NAME,
  clearSessionCookie,
  getSessionToken,
  setSessionCookie,
} from './session/auth.cookie';
import { CurrentUser, CurrentUserDto } from '../common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AuthLoginQueryDto } from './dto/auth-login-query.dto';
import { OAuthCallbackQueryDto } from './dto/oauth-callback-query.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @ApiOperation({ summary: 'Start Google OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to the Google account chooser through Cognito.',
  })
  @ApiBadRequestResponse({ description: 'Invalid app or returnTo URL.' })
  async loginController(@Query() query: AuthLoginQueryDto, @Res() response: Response) {
    const authorizeUrl = await this.authService.beginLoginService(query.app, query.returnTo);
    response.redirect(authorizeUrl);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Complete the Cognito OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Sets the opaque lb_session cookie and redirects to the requested app.',
  })
  @ApiBadRequestResponse({ description: 'Invalid OAuth state or OAuth denial.' })
  @ApiUnauthorizedResponse({
    description: 'Missing authorization code or invalid Cognito ID token.',
  })
  async callbackController(@Query() query: OAuthCallbackQueryDto, @Res() response: Response) {
    const login = await this.authService.completeLoginService(query.code, query.state, query.error);

    // Only the opaque session token reaches the browser; Cognito tokens stay server-side.
    setSessionCookie(response, login.token, login.expiresAt);
    response.redirect(login.returnTo);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get the current LastBite user' })
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOkResponse({ type: CurrentUserDto })
  @ApiUnauthorizedResponse({ description: 'Session is missing, expired, or revoked.' })
  meController(@CurrentUser() user: CurrentUserDto): CurrentUserDto {
    return user;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke the current session and clear its cookie' })
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiNoContentResponse({ description: 'The browser session cookie has been cleared.' })
  @HttpCode(204)
  async logoutController(
    @Headers('cookie') cookie: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = getSessionToken(cookie);
    if (token) await this.authService.logoutService(token);
    clearSessionCookie(response);
  }
}
