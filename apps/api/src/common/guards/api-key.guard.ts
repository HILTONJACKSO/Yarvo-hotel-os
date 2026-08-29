import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    
    // Look for x-api-key header
    const apiKey = request.headers['x-api-key'];
    
    const validApiKey = this.configService.get<string>('PUBLIC_API_KEY');
    
    if (!validApiKey) {
      // If API key is not configured on the server, deny access to prevent accidental exposure
      throw new UnauthorizedException('Public API integrations are currently disabled.');
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }
}
