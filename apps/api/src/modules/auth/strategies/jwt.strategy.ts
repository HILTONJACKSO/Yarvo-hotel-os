import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

// Extract JWT from the HttpOnly cookie set by @fastify/cookie
// We cannot use req.cookies directly in the jwtFromRequest at the type level,
// so we read from raw headers as a fallback-safe approach.
function cookieExtractor(req: any): string | null {
  if (req && req.cookies && req.cookies['accessToken']) {
    return req.cookies['accessToken'];
  }
  // Fallback: parse cookie header manually (handles pre-plugin edge cases)
  const cookieHeader: string = req?.headers?.cookie ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) throw new Error('JWT_ACCESS_SECRET is not configured');

    const opts: StrategyOptionsWithoutRequest = {
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: secret,
    };
    super(opts);
  }

  async validate(payload: { sub: string; email: string; roles: string[] }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: true },
    });

    if (!user || !user.isActive || user.isLocked) {
      throw new UnauthorizedException('User is not authorized');
    }

    return {
      id: user.id,
      email: user.email,
      roles: user.roles.map((r: any) => r.name),
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}

