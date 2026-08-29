import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  LoggerService,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  details?: unknown;
  requestId: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const requestId = (request.headers['x-request-id'] as string) ?? uuidv4();
    const timestamp = new Date().toISOString();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = 'An unexpected error occurred';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
        error = exception.message;
      } else if (typeof response === 'object' && response !== null) {
        const res = response as Record<string, unknown>;
        message = (res['message'] as string | string[]) ?? exception.message;
        error = (res['error'] as string) ?? exception.name;
        details = res['details'];
      }
    } else if (exception instanceof Error) {
      // Don't expose internal error details to clients
      message = 'An unexpected error occurred';
      error = 'Internal Server Error';

      // Log the actual error internally
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
        'AllExceptionsFilter',
      );
    }

    // Log all 5xx errors
    if (statusCode >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
        'AllExceptionsFilter',
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `[${requestId}] ${request.method} ${request.url} → ${statusCode}: ${Array.isArray(message) ? message.join(', ') : message}`,
        'AllExceptionsFilter',
      );
    }

    const responseBody: ApiErrorResponse = {
      statusCode,
      error,
      message,
      ...(details !== undefined && { details }),
      requestId,
      timestamp,
    };

    void reply.status(statusCode).send(responseBody);
  }
}

