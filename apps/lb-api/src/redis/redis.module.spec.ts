import { createClient } from 'redis';
import { TEST_REDIS_ENV, useTestEnvironment } from '../test-support/test-environment';
import { RedisService } from './redis.module';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

function createRedisClient(connect: jest.Mock) {
  const client = {
    isOpen: false,
    isReady: false,
    connect,
    destroy: jest.fn(),
    on: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
  };
  client.on.mockReturnValue(client);
  return client;
}

describe('RedisService', () => {
  let restoreEnvironment: () => void;

  beforeAll(() => {
    restoreEnvironment = useTestEnvironment(TEST_REDIS_ENV);
  });

  afterAll(() => {
    restoreEnvironment();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses a fresh client after the startup connection fails', async () => {
    const firstClient = createRedisClient(jest.fn().mockRejectedValue(new Error('offline')));
    const recoveredClient = createRedisClient(jest.fn().mockResolvedValue({}));
    jest
      .mocked(createClient)
      .mockReturnValueOnce(firstClient as never)
      .mockReturnValueOnce(recoveredClient as never);

    const service = new RedisService();
    await service.onModuleInit();
    await service.set('session-key', 'value', 60);

    expect(createClient).toHaveBeenCalledTimes(2);
    expect(recoveredClient.connect).toHaveBeenCalledTimes(1);
    expect(recoveredClient.set).toHaveBeenCalledWith('session-key', 'value', {
      EX: 60,
    });
  });
});
