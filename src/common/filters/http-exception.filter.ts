// ============================================================
// GLOBAL EXCEPTION FILTER: Centralized error handling.
// Catches ALL exceptions and returns a consistent JSON shape.
// ============================================================
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error: string;
}

@Catch() // Catches everything (no argument = catch-all)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const reply = ctx.getResponse<FastifyReply>();

    let status: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      message =
        typeof response === 'object' && 'message' in response
          ? (response as any).message
          : exception.message;
      error =
        typeof response === 'object' && 'error' in response
          ? (response as any).error
          : HttpStatus[status];
    } else if (exception instanceof Error) {
      // Unexpected errors (DB failures, etc.)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'InternalServerError';
      this.logger.error(exception.message, exception.stack);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'UnknownError';
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    };

    this.logger.warn(`${request.method} ${request.url} → ${status}`);
    reply.status(status).send(errorResponse);
  }
}