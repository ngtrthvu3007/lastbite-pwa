import { authIdentities, users } from '../db/schema';
import { CognitoProfile, CognitoUserService } from './cognito-user.service';

const profile: CognitoProfile = {
  cognitoSub: 'cognito-sub',
  email: 'user@example.com',
  displayName: 'LastBite User',
  avatarUrl: 'https://example.com/avatar.jpg',
};

function createTransaction(existingUserId?: string) {
  const execute = jest.fn().mockResolvedValue(undefined);
  const limit = jest
    .fn()
    .mockResolvedValue(existingUserId ? [{ userId: existingUserId }] : []);
  const select = jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({ limit }),
    }),
  });
  const updateSet = jest.fn().mockReturnValue({
    where: jest.fn().mockResolvedValue(undefined),
  });
  const update = jest.fn().mockReturnValue({ set: updateSet });
  const userValues = jest.fn().mockReturnValue({
    returning: jest.fn().mockResolvedValue([{ id: 'new-user-id' }]),
  });
  const identityValues = jest.fn().mockResolvedValue(undefined);
  const insert = jest.fn((table: unknown) => {
    if (table === users) return { values: userValues };
    if (table === authIdentities) return { values: identityValues };
    throw new Error('Unexpected table');
  });

  return {
    tx: { execute, select, update, insert },
    execute,
    insert,
    updateSet,
    identityValues,
  };
}

describe('CognitoUserService', () => {
  it('creates a user and identity on first login', async () => {
    const transaction = createTransaction();
    const db = {
      transaction: jest.fn((callback) => callback(transaction.tx)),
    };
    const service = new CognitoUserService(db as never);

    const userId = await service.syncUser(profile);

    expect(transaction.execute).toHaveBeenCalledTimes(1);
    expect(transaction.insert).toHaveBeenCalledWith(users);
    expect(transaction.identityValues).toHaveBeenCalledWith({
      userId: 'new-user-id',
      provider: 'cognito',
      providerSubject: profile.cognitoSub,
    });
    expect(userId).toBe('new-user-id');
  });

  it('updates an existing user without creating duplicates', async () => {
    const transaction = createTransaction('existing-user-id');
    const db = {
      transaction: jest.fn((callback) => callback(transaction.tx)),
    };
    const service = new CognitoUserService(db as never);

    const userId = await service.syncUser(profile);

    expect(transaction.insert).not.toHaveBeenCalled();
    expect(transaction.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        email: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      }),
    );
    expect(userId).toBe('existing-user-id');
  });
});
