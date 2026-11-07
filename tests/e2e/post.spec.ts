import { expect, test, type BrowserContext, type Request } from '@playwright/test';
import { buildHintCookie, SESSION_COOKIE } from '../support/cookies';
import { closeDb, deleteUser, seedSession, seedStore } from '../support/db';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const STORE = { id: 'store-1', name: 'Bánh mì Cô Hai', phone: '0912345678', address: '12 Nguyễn Trãi, Quận 1' };
const SNAPSHOT = { name: 'Quầy Bánh mì cuối ngày', phone: '0987654321', address: '34 Lê Lợi, Quận 1' };

let seededUserId: string | undefined;

const operationOf = (request: Request) => request.postDataJSON()?.operationName as string | undefined;

async function signIn(context: BrowserContext, webUrl: string) {
  const { userId, token } = await seedSession(3 * DAY_MS);
  seededUserId = userId;
  await seedStore(userId, STORE);
  await context.addCookies([
    { name: SESSION_COOKIE, value: token, url: webUrl, httpOnly: true },
    buildHintCookie(webUrl),
  ]);
}

const formatDateTimeLocal = (date: Date) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
};

test.afterEach(async () => {
  if (seededUserId) await deleteUser(seededUserId);
  seededUserId = undefined;
});

test.afterAll(closeDb);

test.describe('Quick Post', () => {
  test('[LB-20] keeps the form open and shows time errors before uploading an image', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, baseURL!);
    let imageUploadRequests = 0;
    await page.route('**/graphql', async (route) => {
      if (operationOf(route.request()) === 'CreatePostImageUpload') imageUploadRequests += 1;
      await route.continue();
    });
    await page.goto('/merchant/posts/new');

    await page.getByLabel('Ảnh món ăn').setInputFiles({
      name: 'banh-mi.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-jpeg'),
    });
    await page.getByLabel('Tên món').fill('Bánh mì cuối ngày');
    await page.getByLabel('Giá bán (VND)').fill('15000');
    await page.getByLabel('Số lượng').fill('3');
    await page.getByLabel('Bắt đầu lấy hàng').fill(formatDateTimeLocal(new Date(Date.now() + 3 * HOUR_MS)));
    await page.getByLabel('Kết thúc lấy hàng').fill(formatDateTimeLocal(new Date(Date.now() + HOUR_MS)));
    await page.getByLabel('Hết hạn lúc').fill(formatDateTimeLocal(new Date(Date.now() + 2 * HOUR_MS)));
    await page.getByRole('button', { name: 'Đăng món' }).click();

    await expect(page.getByText('Nhập thời gian lấy hàng hợp lệ.').first()).toBeVisible();
    await expect(page).toHaveURL(/\/merchant\/posts\/new$/);
    expect(imageUploadRequests).toBe(0);
  });

  test('[LB-20] uploads the selected image, then creates a post with the edited contact snapshot', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, baseURL!);
    const operations: { name: string; variables: Record<string, unknown> }[] = [];

    await page.route('**/graphql', async (route) => {
      const name = operationOf(route.request());
      const variables = route.request().postDataJSON()?.variables as Record<string, unknown>;
      if (name) operations.push({ name, variables });

      switch (name) {
        case 'MyStore':
          return route.continue();
        case 'CreatePostImageUpload':
          return route.fulfill({
            json: { data: { createPostImageUpload: { assetId: 'asset-1', uploadUrl: 'https://upload.example.test/post-image', fields: [{ name: 'key', value: 'uploads/test/banh-mi.jpg' }], expiresAt: new Date(Date.now() + DAY_MS).toISOString() } } },
          });
        case 'CompletePostImageUpload':
          return route.fulfill({ json: { data: { completePostImageUpload: { id: 'asset-1' } } } });
        case 'CreatePost':
          return route.fulfill({ json: { data: { createPost: { id: 'post-1' } } } });
        default:
          return route.continue();
      }
    });
    let uploadMethod: string | undefined;
    await page.route('https://upload.example.test/**', (route) => {
      uploadMethod = route.request().method();
      return route.fulfill({ status: 200 });
    });

    await page.goto('/merchant/posts/new');
    await expect(page.getByRole('heading', { name: 'Đăng món dư' })).toBeVisible();
    await expect(page.getByLabel('Tên cửa hàng')).toHaveValue(STORE.name);
    await expect(page.getByLabel('Số điện thoại')).toHaveValue(STORE.phone);
    await expect(page.getByLabel('Địa chỉ')).toHaveValue(STORE.address);

    await page.getByLabel('Ảnh món ăn').setInputFiles({
      name: 'banh-mi.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-jpeg'),
    });
    await page.getByLabel('Tên món').fill('Bánh mì cuối ngày');
    await page.getByLabel('Mô tả').fill('Còn nóng, lấy trong hôm nay.');
    await page.getByLabel('Giá gốc (VND)').fill('30000');
    await page.getByLabel('Giá bán (VND)').fill('15000');
    await page.getByLabel('Số lượng').fill('3');
    await page.getByLabel('Bắt đầu lấy hàng').fill(formatDateTimeLocal(new Date(Date.now() + HOUR_MS)));
    await page.getByLabel('Kết thúc lấy hàng').fill(formatDateTimeLocal(new Date(Date.now() + 3 * HOUR_MS)));
    await page.getByLabel('Hết hạn lúc').fill(formatDateTimeLocal(new Date(Date.now() + 2 * HOUR_MS)));
    await page.getByLabel('Tên cửa hàng').fill(SNAPSHOT.name);
    await page.getByLabel('Số điện thoại').fill(SNAPSHOT.phone);
    await page.getByLabel('Địa chỉ').fill(SNAPSHOT.address);
    await page.getByRole('button', { name: 'Đăng món' }).click();

    await expect(page).toHaveURL(/\/merchant$/);
    const postOperations = operations.filter(({ name }) => name !== 'MyStore');
    expect(postOperations.map(({ name }) => name)).toEqual([
      'CreatePostImageUpload',
      'CompletePostImageUpload',
      'CreatePost',
    ]);
    expect(postOperations[0].variables).toEqual({ input: { contentType: 'image/jpeg' } });
    expect(postOperations[1].variables).toEqual({ assetId: 'asset-1' });
    expect(uploadMethod).toBe('POST');
    expect(postOperations[2].variables).toMatchObject({
      input: {
        imageAssetId: 'asset-1',
        title: 'Bánh mì cuối ngày',
        originalPrice: 30000,
        currentPrice: 15000,
        quantity: 3,
        storeName: SNAPSHOT.name,
        phone: SNAPSHOT.phone,
        address: SNAPSHOT.address,
      },
    });
  });
});
