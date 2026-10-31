import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { SESSION_ROTATE_BELOW_MS } from './auth.constants';
import { AuthGuard } from './auth.guard';

// LB-107 / LB-105: the guard behaves the same for REST and for a GraphQL resolver.

const USER = { id: 'user-id', email: 'customer@example.com', displayName: null, avatarUrl: null };
const COOKIE = 'lb_session=session-token';
const DAY_MS = 24 * 60 * 60 * 1000;

function createAuth(session: { user: typeof USER; expiresAt: Date } | null) {
  return {
    getActiveSessionService: jest.fn().mockResolvedValue(session),
    rotateSessionService: jest.fn().mockResolvedValue(null),
  };
}

function createRequest(cookie?: string) {
  return { headers: { cookie }, currentUser: undefined };
}

function createResponse() {
  return { setHeader: jest.fn(), cookie: jest.fn() };
}

const contexts = {
  REST: (req: object, res: object) => new ExecutionContextHost([req, res]),
  GraphQL: (req: object, res: object) => {
    // A resolver gets [root, args, context, info]; with only 3 args Nest treats it as a reference resolver.
    const context = new ExecutionContextHost([undefined, undefined, { req, res }, undefined]);
    context.setType('graphql');

    return context;
  },
};

describe.each(Object.entries(contexts))('AuthGuard in %s', (_, createContext) => {
  it('attaches the user when the cookie holds an active session', async () => {
    const auth = createAuth({ user: USER, expiresAt: new Date(Date.now() + DAY_MS) });
    const request = createRequest(COOKIE);

    const allowed = await new AuthGuard(auth as never).canActivate(
      createContext(request, createResponse()),
    );

    expect(allowed).toBe(true);
    expect(auth.getActiveSessionService).toHaveBeenCalledWith('session-token');
    expect(request.currentUser).toBe(USER);
  });

  it('rejects a request without the session cookie', async () => {
    const auth = createAuth(null);
    const response = createResponse();

    await expect(
      new AuthGuard(auth as never).canActivate(createContext(createRequest(), response)),
    ).rejects.toThrow(UnauthorizedException);

    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });

  it('rejects an expired or revoked session', async () => {
    const auth = createAuth(null);

    await expect(
      new AuthGuard(auth as never).canActivate(
        createContext(createRequest(COOKIE), createResponse()),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('sends a new session cookie when the session is close to expiry', async () => {
    const auth = createAuth({
      user: USER,
      expiresAt: new Date(Date.now() + SESSION_ROTATE_BELOW_MS - 60_000),
    });
    auth.rotateSessionService.mockResolvedValue({
      token: 'new-token',
      expiresAt: new Date(Date.now() + 7 * DAY_MS),
    });
    const response = createResponse();

    await new AuthGuard(auth as never).canActivate(createContext(createRequest(COOKIE), response));

    expect(response.cookie).toHaveBeenCalledWith('lb_session', 'new-token', expect.anything());
  });
});
