import type { ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import type { Response } from 'express';
import type { AuthenticatedRequest } from './types/current-user.type';

// REST and GraphQL hand over req/res differently; the guard and CurrentUser both read them here.
export function getRequestContext(context: ExecutionContext): {
  req: AuthenticatedRequest;
  res: Response;
} {
  if (context.getType<GqlContextType>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext();
  }

  const http = context.switchToHttp();

  return { req: http.getRequest(), res: http.getResponse() };
}
