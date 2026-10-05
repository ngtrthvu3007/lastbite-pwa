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
function runDecorator(request: object): CurrentUserDto {
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, HANDLER_NAME);
  const { factory } = args[Object.keys(args)[0]];

  return factory(undefined, new ExecutionContextHost([request]));
}

describe('CurrentUser', () => {
  it('returns the user that AuthGuard attached to the request', () => {
    expect(runDecorator({ currentUser: USER })).toBe(USER);
  });

  it('throws 401 when no user is attached, for example a route without AuthGuard', () => {
    expect(() => runDecorator({})).toThrow(UnauthorizedException);
  });
});
