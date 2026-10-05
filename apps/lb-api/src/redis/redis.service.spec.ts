import { createClient } from 'redis';
import { RedisService } from './redis.service';

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
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not hide a Redis failure after startup', async () => {
    const client = createRedisClient(jest.fn().mockRejectedValue(new Error('offline')));
    client.set.mockRejectedValue(new Error('offline'));
    jest.mocked(createClient).mockReturnValue(client as never);

    const service = new RedisService();
    await service.onModuleInit();
    await expect(service.set('session-key', 'value', 60)).rejects.toThrow('offline');

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(client.set).toHaveBeenCalledWith('session-key', 'value', { EX: 60 });
  });
});
