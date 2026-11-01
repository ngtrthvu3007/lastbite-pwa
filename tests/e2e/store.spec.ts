import { expect, test, type BrowserContext, type Page, type Request } from '@playwright/test';
import { buildHintCookie, SESSION_COOKIE } from '../support/cookies';
import { closeDb, deleteUser, seedSession, seedStore } from '../support/db';

// Cases come from LB-104: the Cửa hàng screens, the create form and its states. The app shows
// Vietnamese text, so the tests look for it.

const DAY_MS = 24 * 60 * 60 * 1000;

const STORE = { name: 'Bánh mì Cô Hai', phone: '0912 345 678', address: '12 Nguyễn Trãi, Quận 1' };
const SAVED_STORE = { ...STORE, phone: '0912345678' };

let seededUserId: string | undefined;

// Signs the browser in with a real session row, as if the Google flow had just finished.
async function signIn(context: BrowserContext, webUrl: string) {
  const { userId, token } = await seedSession(3 * DAY_MS);
  seededUserId = userId;

  await context.addCookies([
    { name: SESSION_COOKIE, value: token, url: webUrl, httpOnly: true },
    buildHintCookie(webUrl),
  ]);

  return userId;
}

const operationOf = (request: Request) => request.postDataJSON()?.operationName as string | undefined;

async function fillStoreForm(page: Page, { name, phone, address }: typeof STORE) {
  await page.getByLabel('Tên cửa hàng').fill(name);
  await page.getByLabel('Số điện thoại').fill(phone);
  await page.getByLabel('Địa chỉ').fill(address);
}

// What a screen reader says for a field: the error shown under it, or nothing.
const errorOf = (page: Page, label: string) => page.getByLabel(label);

test.afterEach(async () => {
  if (seededUserId) await deleteUser(seededUserId);
  seededUserId = undefined;
});

test.afterAll(closeDb);

test.describe('Cửa hàng screens', () => {
  test('[LB-104] a user without a store goes from MerchantHome to the empty screen, then to the form', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, baseURL!);

    await page.goto('/merchant');
    await page.getByRole('link', { name: 'Cửa hàng' }).click();

    await expect(page).toHaveURL(/\/merchant\/store$/);
    await expect(page.getByText('Bạn chưa có cửa hàng')).toBeVisible();

    await page.getByRole('button', { name: 'Tạo cửa hàng' }).click();

    await expect(page).toHaveURL(/\/merchant\/store\/new$/);
  });

  test('[LB-104] a user with a store sees its details and no form', async ({ page, context, baseURL }) => {
    const userId = await signIn(context, baseURL!);
    await seedStore(userId, SAVED_STORE);

    await page.goto('/merchant/store');

    await expect(page.getByRole('heading', { name: SAVED_STORE.name })).toBeVisible();
    await expect(page.getByText(SAVED_STORE.phone)).toBeVisible();
    await expect(page.getByText(SAVED_STORE.address)).toBeVisible();
    await expect(page.getByText('Bạn chưa có cửa hàng')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tạo cửa hàng' })).toHaveCount(0);
  });

  test('[LB-104] a guest opening the store screens is sent to login', async ({ page }) => {
    await page.goto('/merchant/store');

    await expect(page).toHaveURL(/\/login\?redirect=\/merchant\/store$/);
  });
});

test.describe('create store form', () => {
  test('[LB-104] an empty form shows an error under each field and sends no request', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, baseURL!);
    const createRequests: string[] = [];
    page.on('request', (request) => {
      if (operationOf(request) === 'CreateStore') createRequests.push(request.url());
    });

    await page.goto('/merchant/store/new');
    await page.getByRole('button', { name: 'Lưu' }).click();

    await expect(errorOf(page, 'Tên cửa hàng')).toHaveAccessibleDescription('Vui lòng nhập tên cửa hàng');
    await expect(errorOf(page, 'Số điện thoại')).toHaveAccessibleDescription('Vui lòng nhập số điện thoại');
    await expect(errorOf(page, 'Địa chỉ')).toHaveAccessibleDescription('Vui lòng nhập địa chỉ');
    expect(createRequests).toHaveLength(0);
  });

  test('[LB-104] values that break the rules show the matching error and send no request', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, baseURL!);
    const createRequests: string[] = [];
    page.on('request', (request) => {
      if (operationOf(request) === 'CreateStore') createRequests.push(request.url());
    });

    await page.goto('/merchant/store/new');
    await fillStoreForm(page, { name: 'x', phone: '0123456789', address: 'abcd' });
    await page.getByRole('button', { name: 'Lưu' }).click();

    await expect(errorOf(page, 'Tên cửa hàng')).toHaveAccessibleDescription('Tên cửa hàng từ 2 đến 100 ký tự');
    await expect(errorOf(page, 'Số điện thoại')).toHaveAccessibleDescription('Số điện thoại di động không hợp lệ');
    await expect(errorOf(page, 'Địa chỉ')).toHaveAccessibleDescription('Địa chỉ từ 5 đến 255 ký tự');
    expect(createRequests).toHaveLength(0);
  });

  test('[LB-104] fixing a field clears its error and leaves the others', async ({ page, context, baseURL }) => {
    await signIn(context, baseURL!);

    await page.goto('/merchant/store/new');
    await page.getByRole('button', { name: 'Lưu' }).click();
    // Wait until the submit has finished validating; a fix typed before that would be overwritten.
    await expect(errorOf(page, 'Tên cửa hàng')).toHaveAccessibleDescription('Vui lòng nhập tên cửa hàng');

    await page.getByLabel('Tên cửa hàng').fill(STORE.name);

    await expect(errorOf(page, 'Tên cửa hàng')).toHaveAccessibleDescription('');
    await expect(errorOf(page, 'Số điện thoại')).toHaveAccessibleDescription('Vui lòng nhập số điện thoại');
  });

  test('[LB-104] a valid form disables the fields and the button while saving, then goes to MerchantHome', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, baseURL!);
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/graphql', async (route) => {
      if (operationOf(route.request()) === 'CreateStore') await held;
      await route.continue();
    });

    await page.goto('/merchant/store/new');
    await fillStoreForm(page, STORE);
    await page.getByRole('button', { name: 'Lưu' }).click();

    await expect(page.getByRole('button', { name: 'Đang lưu…' })).toBeDisabled();
    await expect(page.getByLabel('Tên cửa hàng')).toBeDisabled();

    release();

    await expect(page).toHaveURL(/\/merchant$/);
    await page.getByRole('link', { name: 'Cửa hàng' }).click();
    await expect(page.getByRole('heading', { name: SAVED_STORE.name })).toBeVisible();
    await expect(page.getByText(SAVED_STORE.phone)).toBeVisible();
  });

  test('[LB-104] a user who already has a store sees the banner with a link to it, and the form keeps its values', async ({
    page,
    context,
    baseURL,
  }) => {
    const userId = await signIn(context, baseURL!);
    await seedStore(userId, SAVED_STORE);

    await page.goto('/merchant/store/new');
    await fillStoreForm(page, STORE);
    await page.getByRole('button', { name: 'Lưu' }).click();

    await expect(page.getByRole('alert')).toContainText('Bạn đã có cửa hàng.');
    await expect(page.getByLabel('Tên cửa hàng')).toHaveValue(STORE.name);

    await page.getByRole('link', { name: 'Xem cửa hàng' }).click();

    await expect(page).toHaveURL(/\/merchant\/store$/);
    await expect(page.getByRole('heading', { name: SAVED_STORE.name })).toBeVisible();
  });

  test('[LB-104] a validation error from the API shows under the field it names', async ({
    page,
    context,
    baseURL,
  }) => {
    await signIn(context, baseURL!);
    await page.route('**/graphql', async (route) => {
      if (operationOf(route.request()) !== 'CreateStore') return route.continue();

      return route.fulfill({
        json: {
          data: null,
          errors: [
            {
              message: 'Validation failed',
              extensions: { code: 'BAD_USER_INPUT', fields: [{ field: 'phone', code: 'PHONE_INVALID' }] },
            },
          ],
        },
      });
    });

    await page.goto('/merchant/store/new');
    await fillStoreForm(page, STORE);
    await page.getByRole('button', { name: 'Lưu' }).click();

    await expect(errorOf(page, 'Số điện thoại')).toHaveAccessibleDescription('Số điện thoại di động không hợp lệ');
    await expect(errorOf(page, 'Tên cửa hàng')).toHaveAccessibleDescription('');
  });

  test('[LB-104] a network failure shows a toast and the form keeps its values', async ({ page, context, baseURL }) => {
    await signIn(context, baseURL!);
    await page.route('**/graphql', (route) =>
      operationOf(route.request()) === 'CreateStore' ? route.abort('failed') : route.continue(),
    );

    await page.goto('/merchant/store/new');
    await fillStoreForm(page, STORE);
    await page.getByRole('button', { name: 'Lưu' }).click();

    await expect(page.getByText('Chưa lưu được cửa hàng')).toBeVisible();
    await expect(page).toHaveURL(/\/merchant\/store\/new$/);
    await expect(page.getByLabel('Tên cửa hàng')).toHaveValue(STORE.name);
    await expect(page.getByLabel('Số điện thoại')).toHaveValue(STORE.phone);
  });
});
