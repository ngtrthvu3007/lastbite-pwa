import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { callGraphql } from '../support/api';
import { closeDb, deleteUser, queryDb, seedSession, seedStore } from '../support/db';

const HOUR_MS = 60 * 60 * 1000;

const ACTIVE_POSTS = `query ($limit: Int) {
  activePosts(limit: $limit) {
    id imageUrl title description originalPrice currentPrice remainingQuantity
    pickupStartAt pickupEndAt expiresAt storeName phone address createdAt status
  }
}`;

const POST = `query ($id: ID!) {
  post(id: $id) {
    id imageUrl title description originalPrice currentPrice remainingQuantity
    pickupStartAt pickupEndAt expiresAt storeName phone address createdAt status
  }
}`;

const CLOSE_POST = `mutation ($input: ClosePostInput!) {
  closePost(input: $input) {
    id status
  }
}`;

interface PostData {
  id: string;
  imageUrl: string;
  title: string;
  currentPrice: number;
  remainingQuantity: number;
  storeName: string;
  phone: string;
  address: string;
  status: 'ACTIVE' | 'CLOSED' | 'EXPIRED';
}

interface GraphqlBody {
  data?: { activePosts?: PostData[]; post?: PostData | null; closePost?: PostData };
  errors?: { extensions?: { code?: string } }[];
}

const toData = (body: unknown) => body as GraphqlBody;

const seededUsers: string[] = [];

async function seedPost(options: { expiresAt: Date; remainingQuantity: number; title: string }) {
  const session = await seedSession(3 * 24 * HOUR_MS);
  seededUsers.push(session.userId);
  await seedStore(session.userId, {
    name: 'Bánh mì Cô Hai',
    phone: '0912345678',
    address: '12 Nguyễn Trãi, Quận 1',
  });
  const store = await queryDb('select id from stores where owner_id = $1', [session.userId]);
  const asset = await queryDb(
    `insert into media_assets (owner_user_id, object_key, content_type, uploaded_at)
     values ($1, $2, 'image/jpeg', now()) returning id`,
    [session.userId, `uploads/test/${randomUUID()}.jpg`],
  );
  const pickupStartAt = new Date(Date.now() + HOUR_MS);
  const pickupEndAt = new Date(Date.now() + 4 * HOUR_MS);
  const post = await queryDb(
    `insert into posts (
      store_id, image_asset_id, title, description, original_price, current_price,
      initial_quantity, remaining_quantity, pickup_start_at, pickup_end_at, expires_at,
      store_name_snapshot, phone_snapshot, address_snapshot
    ) values ($1, $2, $3, 'Fresh today', 30000, 15000, 3, $4, $5, $6, $7, $8, $9, $10)
    returning id`,
    [
      store.rows[0].id,
      asset.rows[0].id,
      options.title,
      options.remainingQuantity,
      pickupStartAt,
      pickupEndAt,
      options.expiresAt,
      'Điểm lấy hàng riêng',
      '0987654321',
      '34 Lê Lợi, Quận 1',
    ],
  );

  return { id: post.rows[0].id, token: session.token };
}

test.afterEach(async () => {
  await Promise.all(seededUsers.splice(0).map(deleteUser));
});

test.afterAll(closeDb);

test.describe('public post discovery', () => {
  test('[LB-19] [LB-20] returns only active posts with their immutable contact snapshot', async ({ playwright }) => {
    const activePost = await seedPost({
      expiresAt: new Date(Date.now() + 2 * HOUR_MS),
      remainingQuantity: 2,
      title: 'Bánh mì còn nóng',
    });
    await seedPost({
      expiresAt: new Date(Date.now() - HOUR_MS),
      remainingQuantity: 2,
      title: 'Post đã hết hạn',
    });
    await seedPost({
      expiresAt: new Date(Date.now() + 2 * HOUR_MS),
      remainingQuantity: 0,
      title: 'Post hết phần',
    });

    const { status, body } = await callGraphql(playwright, ACTIVE_POSTS, { limit: 20 });
    const posts = toData(body).data?.activePosts;

    expect(status).toBe(200);
    expect(posts).toHaveLength(1);
    expect(posts?.[0]).toMatchObject({
      id: activePost.id,
      title: 'Bánh mì còn nóng',
      currentPrice: 15000,
      remainingQuantity: 2,
      storeName: 'Điểm lấy hàng riêng',
      phone: '0987654321',
      address: '34 Lê Lợi, Quận 1',
    });
    expect(new URL(posts![0].imageUrl).searchParams.has('X-Amz-Signature')).toBe(true);
  });

  test('[LB-19] [LB-20] returns one active post by id and hides expired posts', async ({ playwright }) => {
    const activePost = await seedPost({
      expiresAt: new Date(Date.now() + 2 * HOUR_MS),
      remainingQuantity: 1,
      title: 'Xôi gà',
    });
    const expiredPost = await seedPost({
      expiresAt: new Date(Date.now() - HOUR_MS),
      remainingQuantity: 1,
      title: 'Xôi cũ',
    });

    const active = await callGraphql(playwright, POST, { id: activePost.id });
    const expired = await callGraphql(playwright, POST, { id: expiredPost.id });

    expect(toData(active.body).data?.post).toMatchObject({ id: activePost.id, title: 'Xôi gà' });
    expect(toData(expired.body).data?.post).toBeNull();
  });

  test('[LB-22] closes an owned post and hides it from active discovery', async ({ playwright }) => {
    const ownedPost = await seedPost({
      expiresAt: new Date(Date.now() + 2 * HOUR_MS),
      remainingQuantity: 1,
      title: 'Cơm gà còn một phần',
    });

    const closed = await callGraphql(
      playwright,
      CLOSE_POST,
      { input: { postId: ownedPost.id } },
      ownedPost.token,
    );
    const activePosts = await callGraphql(playwright, ACTIVE_POSTS, { limit: 20 });
    const detail = await callGraphql(playwright, POST, { id: ownedPost.id });

    expect(closed.status).toBe(200);
    expect(toData(closed.body).errors).toBeUndefined();
    expect(toData(closed.body).data?.closePost).toMatchObject({
      id: ownedPost.id,
      status: 'CLOSED',
    });
    expect(toData(activePosts.body).data?.activePosts).not.toContainEqual(
      expect.objectContaining({ id: ownedPost.id }),
    );
    expect(toData(detail.body).data?.post).toMatchObject({
      id: ownedPost.id,
      status: 'CLOSED',
    });
  });

  test('[LB-22] rejects a close request from a non-owner', async ({ playwright }) => {
    const ownedPost = await seedPost({
      expiresAt: new Date(Date.now() + 2 * HOUR_MS),
      remainingQuantity: 1,
      title: 'Bún bò còn nóng',
    });
    const otherSession = await seedSession(3 * 24 * HOUR_MS);
    seededUsers.push(otherSession.userId);

    const response = await callGraphql(
      playwright,
      CLOSE_POST,
      { input: { postId: ownedPost.id } },
      otherSession.token,
    );

    expect(response.status).toBe(200);
    expect(toData(response.body).errors?.[0]?.extensions?.code).toBe('POST_FORBIDDEN');
  });

  test('[LB-22] rejects closing expired or already closed posts', async ({ playwright }) => {
    const expiredPost = await seedPost({
      expiresAt: new Date(Date.now() - HOUR_MS),
      remainingQuantity: 1,
      title: 'Mì Ý đã hết giờ',
    });
    const activePost = await seedPost({
      expiresAt: new Date(Date.now() + 2 * HOUR_MS),
      remainingQuantity: 1,
      title: 'Bánh bao còn nóng',
    });

    const expired = await callGraphql(
      playwright,
      CLOSE_POST,
      { input: { postId: expiredPost.id } },
      expiredPost.token,
    );
    await callGraphql(
      playwright,
      CLOSE_POST,
      { input: { postId: activePost.id } },
      activePost.token,
    );
    const closed = await callGraphql(
      playwright,
      CLOSE_POST,
      { input: { postId: activePost.id } },
      activePost.token,
    );

    expect(toData(expired.body).errors?.[0]?.extensions?.code).toBe('POST_NOT_ACTIVE');
    expect(toData(closed.body).errors?.[0]?.extensions?.code).toBe('POST_NOT_ACTIVE');
  });
});
