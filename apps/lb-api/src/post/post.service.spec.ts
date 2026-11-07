import { posts } from '../db/schema';
import { MediaService } from '../media/media.service';
import { CreatePostInput, PostStatus } from './dto/post.dto';
import { PostService } from './post.service';

const input: CreatePostInput = {
  imageAssetId: '8f89d6ef-6f0c-4b9f-b0b3-3c0ea3a0c5e2',
  title: 'Banh mi cuoi ngay',
  description: 'Con ngon trong ngay',
  originalPrice: 30000,
  currentPrice: 15000,
  quantity: 2,
  pickupStartAt: new Date('2030-01-01T10:00:00.000Z'),
  pickupEndAt: new Date('2030-01-01T12:00:00.000Z'),
  expiresAt: new Date('2030-01-01T11:30:00.000Z'),
  storeName: 'Banh mi Co Hai',
  phone: '0912345678',
  address: '123 Nguyen Hue',
};

const postRow = {
  id: 'a75b76bd-a219-4ad0-9fa1-66af88f021c0',
  title: input.title,
  description: input.description,
  originalPrice: input.originalPrice,
  currentPrice: input.currentPrice,
  remainingQuantity: input.quantity,
  pickupStartAt: input.pickupStartAt,
  pickupEndAt: input.pickupEndAt,
  expiresAt: input.expiresAt,
  storeName: input.storeName,
  phone: input.phone,
  address: input.address,
  createdAt: new Date('2030-01-01T09:00:00.000Z'),
};

const post = {
  ...postRow,
  imageUrl: 'https://images.example.test/uploads/image.jpg',
  status: PostStatus.ACTIVE,
};

function createPostDb(storeResult: unknown[], postResult: unknown[]) {
  const storeLimit = jest.fn().mockResolvedValue(storeResult);
  const storeWhere = jest.fn().mockReturnValue({ limit: storeLimit });
  const storeFrom = jest.fn().mockReturnValue({ where: storeWhere });
  const select = jest.fn().mockReturnValue({ from: storeFrom });
  const returning = jest.fn().mockResolvedValue(postResult);
  const values = jest.fn().mockReturnValue({ returning });
  const insert = jest.fn().mockReturnValue({ values });

  return { db: { select, insert }, insert, values };
}

describe('PostService', () => {
  it('uses the session owner store and saves immutable contact snapshots', async () => {
    const { db, insert, values } = createPostDb([{ id: 'owned-store-id' }], [postRow]);
    const mediaService = {
      findUploadedPostImageAssetService: jest
        .fn()
        .mockResolvedValue({ id: input.imageAssetId, objectKey: 'uploads/user/image.jpg' }),
      getPostImageUrlService: jest.fn().mockResolvedValue(post.imageUrl),
    };
    const service = new PostService(db as never, mediaService as never);

    await expect(service.createPostService('session-user-id', input)).resolves.toEqual(post);

    expect(mediaService.findUploadedPostImageAssetService).toHaveBeenCalledWith(
      'session-user-id',
      input.imageAssetId,
    );
    expect(mediaService.getPostImageUrlService).toHaveBeenCalledWith('uploads/user/image.jpg');
    expect(insert).toHaveBeenCalledWith(posts);
    expect(values).toHaveBeenCalledWith({
      storeId: 'owned-store-id',
      imageAssetId: input.imageAssetId,
      title: input.title,
      description: input.description,
      originalPrice: input.originalPrice,
      currentPrice: input.currentPrice,
      initialQuantity: input.quantity,
      remainingQuantity: input.quantity,
      pickupStartAt: input.pickupStartAt,
      pickupEndAt: input.pickupEndAt,
      expiresAt: input.expiresAt,
      storeNameSnapshot: input.storeName,
      phoneSnapshot: input.phone,
      addressSnapshot: input.address,
    });
  });

  it('rejects creating a post when the session owner has no store', async () => {
    const { db, insert } = createPostDb([], []);
    const mediaService = { findUploadedPostImageAssetService: jest.fn() };
    const service = new PostService(db as never, mediaService as never);

    await expect(service.createPostService('session-user-id', input)).rejects.toMatchObject({
      extensions: { code: 'STORE_REQUIRED' },
    });

    expect(mediaService.findUploadedPostImageAssetService).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it('rejects a price or pickup-window mismatch before data access', async () => {
    const { db } = createPostDb([], []);
    const service = new PostService(db as never, {} as MediaService);

    await expect(
      service.createPostService('session-user-id', {
        ...input,
        originalPrice: input.currentPrice - 1,
      }),
    ).rejects.toMatchObject({ extensions: { code: 'ORIGINAL_PRICE_INVALID' } });
    await expect(
      service.createPostService('session-user-id', {
        ...input,
        expiresAt: new Date('2030-01-01T12:01:00.000Z'),
      }),
    ).rejects.toMatchObject({ extensions: { code: 'PICKUP_WINDOW_INVALID' } });
  });
});
