import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { callGraphql } from '../support/api';
import { HINT_COOKIE, SESSION_COOKIE } from '../support/cookies';
import { closeDb, deleteUser, expireSession, queryDb, revokeSession, seedSession } from '../support/db';
import { attachJson } from '../support/evidence';

// Cases come from LB-18, LB-103 and LB-107: one store per user, the owner from the session only,
// own store only, and GraphQL that knows the session like REST does.

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const MY_STORE = 'query { myStore { id name phone address createdAt } }';
const CREATE_STORE = `mutation ($input: CreateStoreInput!) {
  createStore(input: $input) { id name phone address createdAt }
}`;
const INSERT_STORE = 'insert into stores (owner_id, name, phone, address) values ($1, $2, $3, $4)';

const VALID_STORE = { name: 'Bánh mì Cô Hai', phone: '+84 912 345 678', address: '12 Nguyễn Trãi, Quận 1' };

interface StoreData {
  id: string;
  name: string;
  phone: string;
  address: string;
  createdAt: string;
}

interface GraphqlBody {
  data?: { myStore?: StoreData | null; createStore?: StoreData } | null;
  errors?: { message: string; extensions: { code: string; fields?: { field: string; code: string }[] } }[];
}

const toBody = (body: unknown) => body as GraphqlBody;
const errorCode = (body: unknown) => toBody(body).errors?.[0].extensions.code;
const errorFields = (body: unknown) => toBody(body).errors?.[0].extensions.fields;

const countStores = async (userId: string) =>
  Number((await queryDb('select count(*) from stores where owner_id = $1', [userId])).rows[0].count);

const seededUsers: string[] = [];

async function seed(expiresInMs: number) {
  const seeded = await seedSession(expiresInMs);
  seededUsers.push(seeded.userId);

  return seeded;
}

test.afterEach(async () => {
  await Promise.all(seededUsers.splice(0).map(deleteUser));
});

test.afterAll(closeDb);

test.describe('createStore', () => {
  test('[LB-103] creates the store of the session user, with the phone stored as 0xxxxxxxxx', async ({
    playwright,
  }) => {
    const { token, userId } = await seed(3 * DAY_MS);

    const { body } = await callGraphql(playwright, CREATE_STORE, { input: VALID_STORE }, token);
    const rows = (await queryDb('select owner_id, phone from stores where owner_id = $1', [userId])).rows;

    await attachJson('createStore', { body, rows });

    expect(toBody(body).data?.createStore).toMatchObject({
      name: VALID_STORE.name,
      phone: '0912345678',
      address: VALID_STORE.address,
    });
    expect(rows).toEqual([{ owner_id: userId, phone: '0912345678' }]);
  });

  test('[LB-103] does not expose the owner', async ({ playwright }) => {
    const { token } = await seed(3 * DAY_MS);

    const { body } = await callGraphql(playwright, 'query { myStore { ownerId } }', undefined, token);

    expect(toBody(body).errors?.[0].message).toContain('ownerId');
  });

  test('[LB-103] a second createStore is refused with STORE_ALREADY_EXISTS and keeps one store', async ({
    playwright,
  }) => {
    const { token, userId } = await seed(3 * DAY_MS);

    await callGraphql(playwright, CREATE_STORE, { input: VALID_STORE }, token);
    const { body } = await callGraphql(playwright, CREATE_STORE, { input: VALID_STORE }, token);

    await attachJson('second createStore', body);

    expect(errorCode(body)).toBe('STORE_ALREADY_EXISTS');
    expect(await countStores(userId)).toBe(1);
  });

  test('[LB-103] two requests at once create exactly one store', async ({ playwright }) => {
    const { token, userId } = await seed(3 * DAY_MS);

    const results = (
      await Promise.all([
        callGraphql(playwright, CREATE_STORE, { input: VALID_STORE }, token),
        callGraphql(playwright, CREATE_STORE, { input: VALID_STORE }, token),
      ])
    ).map(({ body }) => toBody(body));

    await attachJson('both responses', results);

    expect(results.filter(({ data }) => data?.createStore)).toHaveLength(1);
    expect(results.flatMap(({ errors }) => errors?.map(({ extensions }) => extensions.code) ?? [])).toEqual([
      'STORE_ALREADY_EXISTS',
    ]);
    expect(await countStores(userId)).toBe(1);
  });

  test('[LB-103] invalid input answers BAD_USER_INPUT with a { field, code } per field and creates nothing', async ({
    playwright,
  }) => {
    const { token, userId } = await seed(3 * DAY_MS);

    const { status, body } = await callGraphql(
      playwright,
      CREATE_STORE,
      { input: { name: '', phone: '0123456789', address: 'abcd' } },
      token,
    );

    await attachJson('invalid input', { status, body });

    expect(status).toBe(200);
    expect(errorCode(body)).toBe('BAD_USER_INPUT');
    expect(errorFields(body)).toEqual([
      { field: 'name', code: 'NAME_REQUIRED' },
      { field: 'phone', code: 'PHONE_INVALID' },
      { field: 'address', code: 'ADDRESS_INVALID' },
    ]);
    expect(await countStores(userId)).toBe(0);
  });

  test('[LB-103] a phone with a symbol in place of a digit is PHONE_INVALID', async ({ playwright }) => {
    const { token } = await seed(3 * DAY_MS);

    const { body } = await callGraphql(
      playwright,
      CREATE_STORE,
      { input: { ...VALID_STORE, phone: '07|1234567' } },
      token,
    );

    expect(errorFields(body)).toEqual([{ field: 'phone', code: 'PHONE_INVALID' }]);
  });
});

test.describe('myStore', () => {
  test('[LB-103] is null for a user without a store', async ({ playwright }) => {
    const { token } = await seed(3 * DAY_MS);

    const { body } = await callGraphql(playwright, MY_STORE, undefined, token);

    expect(toBody(body).errors).toBeUndefined();
    expect(toBody(body).data?.myStore).toBeNull();
  });

  test('[LB-103] returns the own store', async ({ playwright }) => {
    const { token } = await seed(3 * DAY_MS);
    await callGraphql(playwright, CREATE_STORE, { input: VALID_STORE }, token);

    const { body } = await callGraphql(playwright, MY_STORE, undefined, token);

    expect(toBody(body).data?.myStore).toMatchObject({ name: VALID_STORE.name, phone: '0912345678' });
  });

  test('[LB-18] one user never sees the store of another user', async ({ playwright }) => {
    const alice = await seed(3 * DAY_MS);
    const bob = await seed(3 * DAY_MS);
    await callGraphql(playwright, CREATE_STORE, { input: VALID_STORE }, alice.token);

    const forBob = await callGraphql(playwright, MY_STORE, undefined, bob.token);
    const forAlice = await callGraphql(playwright, MY_STORE, undefined, alice.token);

    await attachJson('myStore', { alice: toBody(forAlice.body).data, bob: toBody(forBob.body).data });

    expect(toBody(forBob.body).data?.myStore).toBeNull();
    expect(toBody(forAlice.body).data?.myStore).toMatchObject({ name: VALID_STORE.name });
  });
});

test.describe('GraphQL authentication', () => {
  test('[LB-107] a request without the session cookie is refused with UNAUTHENTICATED and not cached', async ({
    playwright,
  }) => {
    const mine = await callGraphql(playwright, MY_STORE);
    const create = await callGraphql(playwright, CREATE_STORE, { input: VALID_STORE });

    await attachJson('responses', { mine: mine.body, create: create.body, cache: mine.headers['cache-control'] });

    expect(errorCode(mine.body)).toBe('UNAUTHENTICATED');
    expect(errorCode(create.body)).toBe('UNAUTHENTICATED');
    expect(mine.headers['cache-control']).toBe('no-store');
  });

  test('[LB-107] an expired session is refused with UNAUTHENTICATED', async ({ playwright }) => {
    const { token } = await seed(3 * DAY_MS);
    await expireSession(token);

    const { body } = await callGraphql(playwright, MY_STORE, undefined, token);

    expect(errorCode(body)).toBe('UNAUTHENTICATED');
  });

  test('[LB-107] a revoked session is refused with UNAUTHENTICATED', async ({ playwright }) => {
    const { token } = await seed(3 * DAY_MS);
    await revokeSession(token);

    const { body } = await callGraphql(playwright, CREATE_STORE, { input: VALID_STORE }, token);

    expect(errorCode(body)).toBe('UNAUTHENTICATED');
  });

  test('[LB-107] a session with under 2 hours left is rotated by a GraphQL call too', async ({ playwright }) => {
    const { token } = await seed(HOUR_MS);

    const { body, cookies } = await callGraphql(playwright, MY_STORE, undefined, token);

    await attachJson('rotation', { session: cookies[SESSION_COOKIE], hint: cookies[HINT_COOKIE] });

    expect(toBody(body).errors).toBeUndefined();
    expect(cookies[SESSION_COOKIE]?.value).toBeTruthy();
    expect(cookies[SESSION_COOKIE].value).not.toBe(token);
    expect(cookies[SESSION_COOKIE].httpOnly).toBe(true);
    expect(cookies[HINT_COOKIE]?.value).toBe('1');
  });
});

test.describe('stores table', () => {
  test('[LB-103] one store per owner: a second row for the same owner is rejected by owner_id', async () => {
    const { userId } = await seed(DAY_MS);
    await queryDb(INSERT_STORE, [userId, 'Quán A', '0912345678', '12 Lê Lợi']);

    await expect(queryDb(INSERT_STORE, [userId, 'Quán B', '0912345679', '34 Lê Lợi'])).rejects.toMatchObject({
      code: '23505',
      constraint: 'stores_owner_id_unique',
    });
  });

  test('[LB-103] deleting the user deletes the store (ON DELETE CASCADE)', async () => {
    const { userId } = await seed(DAY_MS);
    await queryDb(INSERT_STORE, [userId, 'Quán A', '0912345678', '12 Lê Lợi']);

    await deleteUser(userId);

    expect(await countStores(userId)).toBe(0);
  });

  test('[LB-103] a store needs an existing owner', async () => {
    await expect(queryDb(INSERT_STORE, [randomUUID(), 'Quán A', '0912345678', '12 Lê Lợi'])).rejects.toMatchObject({
      code: '23503',
    });
  });

  test('[LB-103] phone is a varchar(10): a longer value is rejected', async () => {
    const { userId } = await seed(DAY_MS);

    await expect(queryDb(INSERT_STORE, [userId, 'Quán A', '091234567890', '12 Lê Lợi'])).rejects.toMatchObject({
      code: '22001',
    });
  });
});
