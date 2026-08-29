import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(loginDto: LoginDto, ipAddress: string) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      await this.usersService.recordLoginAttempt(loginDto.email, ipAddress, false);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isLocked) {
      throw new UnauthorizedException(
        'Account is locked due to too many failed login attempts. Contact your administrator.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, loginDto.password);

    if (!isPasswordValid) {
      await this.usersService.recordLoginAttempt(loginDto.email, ipAddress, false);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.recordLoginAttempt(loginDto.email, ipAddress, true);
    return user;
  }

  async login(user: any, ipAddress: string, userAgent: string) {
    const payload = { sub: user.id, email: user.email, roles: user.roles.map((r: any) => r.name) };

    // Use signAsync with explicit options per token type
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '15m' as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d' as any,
    });

    const refreshTokenHash = await argon2.hash(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await this.usersService.createSession(
      user.id,
      refreshTokenHash,
      ipAddress,
      userAgent,
      expiresAt,
    );

    return { accessToken, refreshToken, sessionId: session.id };
  }

  async logout(sessionId: string) {
    await this.usersService.revokeSession(sessionId);
  }

  async refreshTokens(
    sessionId: string,
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const session = await this.usersService.findSession(sessionId);

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired or not found');
    }

    const isTokenValid = await argon2.verify(session.refreshTokenHash, refreshToken);
    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = session.user;
    if (!user || !user.isActive || user.isLocked) {
      throw new UnauthorizedException('User account is invalid');
    }

    // Rotate: revoke old session, create new one
    await this.usersService.revokeSession(session.id);
    return this.login(user, ipAddress, userAgent);
  }
}

