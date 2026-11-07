import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { mediaAssets } from '../db/schema';
import { MediaService } from './media.service';

jest.mock('@aws-sdk/s3-presigned-post', () => ({ createPresignedPost: jest.fn() }));

const createPresignedPostMock = jest.mocked(createPresignedPost);

describe('MediaService', () => {
  it('creates a size-limited upload policy for the authenticated owner', async () => {
    const returning = jest.fn().mockResolvedValue([{ id: 'asset-id' }]);
    const values = jest.fn().mockReturnValue({ returning });
    const insert = jest.fn().mockReturnValue({ values });
    const db = { insert };
    createPresignedPostMock.mockResolvedValue({
      url: 'https://bucket.example.test',
      fields: { key: 'uploads/user-id/image.jpg', 'Content-Type': 'image/jpeg' },
    });
    const service = new MediaService(
      db as never,
      { bucket: 'test-bucket', region: 'ap-southeast-1' },
    );

    const upload = await service.createPostImageUploadService('user-id', {
      contentType: 'image/jpeg',
    });

    expect(insert).toHaveBeenCalledWith(mediaAssets);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ ownerUserId: 'user-id', contentType: 'image/jpeg' }),
    );
    expect(createPresignedPostMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        Bucket: 'test-bucket',
        Fields: { 'Content-Type': 'image/jpeg' },
        Conditions: expect.arrayContaining([
          ['content-length-range', 1, 5 * 1024 * 1024],
          ['eq', '$Content-Type', 'image/jpeg'],
        ]),
        Expires: 300,
      }),
    );
    expect(upload).toEqual(
      expect.objectContaining({
        assetId: 'asset-id',
        uploadUrl: 'https://bucket.example.test',
        fields: expect.arrayContaining([
          { name: 'key', value: 'uploads/user-id/image.jpg' },
          { name: 'Content-Type', value: 'image/jpeg' },
        ]),
        expiresAt: expect.any(Date),
      }),
    );
  });
});
