import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { buildValidationError } from '../../common/validation-error';
import { CreateStoreInput } from './store.dto';

// Rules come from LB-103 (Validation rules) and LB-105, not from the implementation.

type FieldError = { field: string; code: string };

const validStore = {
  name: 'Bánh mì Cô Hai',
  phone: '0912345678',
  address: '123 Đường Nguyễn Huệ',
};

async function validateStore(values: Partial<typeof validStore>) {
  const input = plainToInstance(CreateStoreInput, { ...validStore, ...values });
  const errors = await validate(input);
  const response = buildValidationError(errors).getResponse() as { fields: FieldError[] };

  return { input, fields: response.fields };
}

describe('CreateStoreInput name', () => {
  it.each([
    ['1 character', 'x'],
    ['101 characters', 'x'.repeat(101)],
  ])('returns NAME_INVALID for %s', async (_, name) => {
    const { fields } = await validateStore({ name });

    expect(fields).toEqual([{ field: 'name', code: 'NAME_INVALID' }]);
  });

  it.each([
    ['2 characters', 'ab'],
    ['100 characters', 'x'.repeat(100)],
  ])('accepts %s', async (_, name) => {
    const { fields } = await validateStore({ name });

    expect(fields).toEqual([]);
  });

  it('trims spaces before checking', async () => {
    const { input, fields } = await validateStore({ name: '  ab  ' });

    expect(fields).toEqual([]);
    expect(input.name).toBe('ab');
  });

  it.each([
    ['empty', ''],
    ['only spaces', '   '],
  ])('returns NAME_REQUIRED when %s', async (_, name) => {
    const { fields } = await validateStore({ name });

    expect(fields).toEqual([{ field: 'name', code: 'NAME_REQUIRED' }]);
  });
});

describe('CreateStoreInput phone', () => {
  it.each([
    ['not a mobile prefix', '0123456789'],
    ['landline', '0281234567'],
    ['03 prefix outside 03[2-9]', '0311234567'],
    ['05 prefix outside 05[25689]', '0531234567'],
    ['07 prefix outside 07[06-9]', '0711234567'],
    ['08 prefix outside 08[1-9]', '0801234567'],
    ['9 digits', '091234567'],
    ['11 digits', '09123456789'],
    ['letters', 'abc'],
    ['a symbol in place of a digit', '07|1234567'],
    ['a trailing letter', '0912345678a'],
  ])('returns PHONE_INVALID for %s', async (_, phone) => {
    const { fields } = await validateStore({ phone });

    expect(fields).toEqual([{ field: 'phone', code: 'PHONE_INVALID' }]);
  });

  it.each(['0321234567', '0391234567', '0521234567', '0591234567', '0701234567', '0761234567'])(
    'accepts the real mobile prefix in %s',
    async (phone) => {
      const { input, fields } = await validateStore({ phone });

      expect(fields).toEqual([]);
      expect(input.phone).toBe(phone);
    },
  );

  it.each([
    ['0912345678'],
    ['+84912345678'],
    ['84912345678'],
    ['+84 912 345 678'],
    ['0912 345 678'],
    ['091.234.5678'],
    ['091-234-5678'],
  ])('stores %s as 0912345678', async (phone) => {
    const { input, fields } = await validateStore({ phone });

    expect(fields).toEqual([]);
    expect(input.phone).toBe('0912345678');
  });
});

describe('CreateStoreInput address', () => {
  it.each([
    ['4 characters', 'x'.repeat(4)],
    ['256 characters', 'x'.repeat(256)],
  ])('returns ADDRESS_INVALID for %s', async (_, address) => {
    const { fields } = await validateStore({ address });

    expect(fields).toEqual([{ field: 'address', code: 'ADDRESS_INVALID' }]);
  });

  it.each([
    ['5 characters', 'x'.repeat(5)],
    ['255 characters', 'x'.repeat(255)],
  ])('accepts %s', async (_, address) => {
    const { fields } = await validateStore({ address });

    expect(fields).toEqual([]);
  });

  it('trims spaces before checking', async () => {
    const { input, fields } = await validateStore({ address: '  12 Lê Lợi  ' });

    expect(fields).toEqual([]);
    expect(input.address).toBe('12 Lê Lợi');
  });

  it.each([
    ['empty', ''],
    ['only spaces', '     '],
  ])('returns ADDRESS_REQUIRED when %s', async (_, address) => {
    const { fields } = await validateStore({ address });

    expect(fields).toEqual([{ field: 'address', code: 'ADDRESS_REQUIRED' }]);
  });
});

describe('CreateStoreInput', () => {
  it('returns a { field, code } pair for every empty field', async () => {
    const { fields } = await validateStore({ name: '', phone: '', address: '' });

    expect(fields).toEqual([
      { field: 'name', code: 'NAME_REQUIRED' },
      { field: 'phone', code: 'PHONE_REQUIRED' },
      { field: 'address', code: 'ADDRESS_REQUIRED' },
    ]);
  });

  it('returns a { field, code } pair for every invalid field', async () => {
    const { fields } = await validateStore({ name: 'x', phone: 'abc', address: 'x'.repeat(4) });

    expect(fields).toEqual([
      { field: 'name', code: 'NAME_INVALID' },
      { field: 'phone', code: 'PHONE_INVALID' },
      { field: 'address', code: 'ADDRESS_INVALID' },
    ]);
  });
});
