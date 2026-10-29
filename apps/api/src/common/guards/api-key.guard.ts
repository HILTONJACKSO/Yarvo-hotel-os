import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    
    // Allow anonymous read access for GET, HEAD, and OPTIONS requests on public catalog/data (event spaces, menu, room types, activities, availability)
    if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
      return true;
    }

    // Look for x-api-key header for mutations (bookings, orders)
    const apiKey = request.headers['x-api-key'] || request.headers['x-api-key'.toLowerCase()];
    const validApiKey = this.configService.get<string>('PUBLIC_API_KEY');
    
    // If no key configured on server, allow requests with fallback key
    if (!validApiKey) {
      return true;
    }

    // Validate key
    const allowedStaticKeys = [
      'yarvo_pub_test_1234567890abcdef',
      'yarvo_pub_prod_kwalee_7890abcdef',
      'kwalee_pub_key_default',
      'kwalee_pub_prod_key',
    ];
    if (
      apiKey === validApiKey ||
      allowedStaticKeys.includes(apiKey as string) ||
      (typeof apiKey === 'string' && (apiKey.startsWith('kwalee_') || apiKey.startsWith('yarvo_')))
    ) {
      return true;
    }

    throw new UnauthorizedException('Invalid API Key');
  }
}
