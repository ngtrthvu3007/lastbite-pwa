import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
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
} from './auth.cookie';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { AuthLoginQueryDto } from './dto/auth-login-query.dto';
import { CurrentUserDto } from './dto/current-user.dto';
import { OAuthCallbackQueryDto } from './dto/oauth-callback-query.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('login')
  @ApiOperation({ summary: 'Start Google OAuth login' })
  @ApiQuery({
    name: 'app',
    enum: ['customer', 'merchant'],
    description: 'The app to return to after a successful login.',
  })
  @ApiQuery({
    name: 'provider',
    enum: ['google'],
    required: false,
    description: 'Defaults to Google.',
  })
  @ApiQuery({
    name: 'returnTo',
    required: false,
    description: 'Optional path or URL on the selected app origin.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to the Google account chooser through Cognito.',
  })
  @ApiBadRequestResponse({ description: 'Invalid app, provider, or returnTo URL.' })
  async login(@Query() query: AuthLoginQueryDto, @Res() response: Response): Promise<void> {
    const authorizeUrl = await this.auth.beginLogin(query.app, query.provider, query.returnTo);
    response.redirect(authorizeUrl);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Complete the Cognito OAuth callback' })
  @ApiQuery({
    name: 'code',
    required: false,
    description: 'Authorization code returned on successful login.',
  })
  @ApiQuery({ name: 'state', description: 'OAuth state returned by Cognito.' })
  @ApiQuery({
    name: 'error',
    required: false,
    description: 'OAuth error returned when the user denies login.',
  })
  @ApiResponse({
    status: 302,
    description: 'Sets the opaque lb_session cookie and redirects to the requested app.',
  })
  @ApiBadRequestResponse({ description: 'Invalid OAuth state or OAuth denial.' })
  @ApiUnauthorizedResponse({
    description: 'Missing authorization code or invalid Cognito ID token.',
  })
  async callback(@Query() query: OAuthCallbackQueryDto, @Res() response: Response): Promise<void> {
    const login = await this.auth.completeLogin(query.code, query.state, query.error);

    // Only LastBite's opaque session token reaches the browser. Cognito tokens
    // remain encrypted/server-side and are never returned to the frontend.
    setSessionCookie(response, login.token, login.expiresAt);
    response.redirect(login.returnTo);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get the current LastBite user' })
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOkResponse({ type: CurrentUserDto })
  @ApiUnauthorizedResponse({ description: 'Session is missing, expired, or revoked.' })
  me(@Req() request: AuthenticatedRequest): CurrentUserDto {
    if (!request.currentUser) {
      throw new UnauthorizedException('Authentication is required');
    }

    return CurrentUserDto.from(request.currentUser);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke the current session and clear its cookie' })
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiNoContentResponse({ description: 'The browser session cookie has been cleared.' })
  async logout(@Req() request: AuthenticatedRequest, @Res() response: Response): Promise<void> {
    await this.auth.logout(getSessionToken(request.headers.cookie));
    clearSessionCookie(response);
    response.status(204).send();
  }
}
