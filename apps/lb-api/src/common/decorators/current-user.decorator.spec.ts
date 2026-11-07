import { UnauthorizedException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { CurrentUser } from './current-user.decorator';
import type { CurrentUserDto } from '../types/current-user.type';

const HANDLER_NAME = 'handler';
const USER: CurrentUserDto = {
  id: 'user-id',
  email: 'customer@example.com',
  displayName: 'Customer',
  avatarUrl: null,
};

class TestController {
  handler() {}
}

// Apply the decorator by hand to parameter 0, so no unused parameter is needed.
CurrentUser()(TestController.prototype, HANDLER_NAME, 0);

// createParamDecorator hides its factory; read it back from the route args metadata.
function runDecorator(context: ExecutionContextHost): CurrentUserDto {
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, HANDLER_NAME);
  const { factory } = args[Object.keys(args)[0]];

  return factory(undefined, context);
}

// A resolver receives [root, args, context, info]; the request sits in context.req.
function createGraphqlContext(request: object): ExecutionContextHost {
  const context = new ExecutionContextHost([undefined, undefined, { req: request }, undefined]);
  context.setType('graphql');

  return context;
}

describe('CurrentUser', () => {
  it('returns the user that AuthGuard attached to the request', () => {
    expect(runDecorator(new ExecutionContextHost([{ currentUser: USER }]))).toBe(USER);
  });

  it('throws 401 when no user is attached, for example a route without AuthGuard', () => {
    expect(() => runDecorator(new ExecutionContextHost([{}]))).toThrow(UnauthorizedException);
  });

  it('returns the user attached to the GraphQL request', () => {
    expect(runDecorator(createGraphqlContext({ currentUser: USER }))).toBe(USER);
  });

  it('throws 401 in a GraphQL resolver without AuthGuard', () => {
    expect(() => runDecorator(createGraphqlContext({}))).toThrow(UnauthorizedException);
  });
});
