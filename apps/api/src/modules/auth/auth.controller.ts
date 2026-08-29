import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Augment Fastify types to include @fastify/cookie
type FastifyRequestWithCookies = FastifyRequest & { cookies: Record<string, string | undefined> };
type FastifyReplyWithCookies = FastifyReply & {
  setCookie(name: string, value: string, options?: object): FastifyReply;
  clearCookie(name: string, options?: object): FastifyReply;
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and set HttpOnly cookies' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or locked account' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: FastifyRequestWithCookies,
    @Res({ passthrough: true }) res: FastifyReplyWithCookies,
  ) {
    const ipAddress = req.ip || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const user = await this.authService.validateUser(loginDto, ipAddress);
    const { accessToken, refreshToken, sessionId } = await this.authService.login(
      user,
      ipAddress,
      userAgent,
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieBase = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      domain: process.env.COOKIE_DOMAIN || undefined,
    };

    res.setCookie('accessToken', accessToken, {
      ...cookieBase,
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    res.setCookie('refreshToken', refreshToken, {
      ...cookieBase,
      path: '/api/v1/auth/refresh', // scoped to refresh endpoint
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    res.setCookie('sessionId', sessionId, {
      ...cookieBase,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map((r: any) => r.name),
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Log out and clear session cookies' })
  async logout(
    @Req() req: FastifyRequestWithCookies,
    @Res({ passthrough: true }) res: FastifyReplyWithCookies,
  ) {
    const sessionId = req.cookies['sessionId'];
    if (sessionId) {
      try {
        await this.authService.logout(sessionId);
      } catch (err) {
        // Ignore errors to ensure cookies are always cleared
      }
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieBase = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      domain: process.env.COOKIE_DOMAIN || undefined,
    };

    res.clearCookie('accessToken', { ...cookieBase, path: '/' });
    res.clearCookie('refreshToken', { ...cookieBase, path: '/api/v1/auth/refresh' });
    res.clearCookie('sessionId', { ...cookieBase, path: '/' });

    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtain a new access token using the refresh token cookie' })
  async refresh(
    @Req() req: FastifyRequestWithCookies,
    @Res({ passthrough: true }) res: FastifyReplyWithCookies,
  ) {
    const refreshToken = req.cookies['refreshToken'];
    const sessionId = req.cookies['sessionId'];

    if (!refreshToken || !sessionId) {
      throw new UnauthorizedException('Missing refresh token or session');
    }

    const ipAddress = req.ip || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const {
      accessToken,
      refreshToken: newRefreshToken,
      sessionId: newSessionId,
    } = await this.authService.refreshTokens(sessionId, refreshToken, ipAddress, userAgent);

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieBase = { 
      httpOnly: true, 
      secure: isProduction, 
      sameSite: 'lax' as const,
      domain: process.env.COOKIE_DOMAIN || undefined 
    };

    res.setCookie('accessToken', accessToken, { ...cookieBase, path: '/', maxAge: 15 * 60 });
    res.setCookie('refreshToken', newRefreshToken, {
      ...cookieBase,
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60,
    });
    res.setCookie('sessionId', newSessionId, {
      ...cookieBase,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return { message: 'Token refreshed successfully' };
  }

  @Get('me')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}

