import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  requestId: string;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<T>> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const requestId =
      (request.headers['x-request-id'] as string) ?? uuidv4();

    return next.handle().pipe(
      map((response) => {
        // If response is already structured (has data field), preserve it
        if (response && typeof response === 'object' && 'data' in response) {
          return {
            ...response,
            requestId,
            timestamp: new Date().toISOString(),
          } as ApiSuccessResponse<T>;
        }

        // Otherwise wrap it
        return {
          data: response as T,
          requestId,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

