const PHONE_SEPARATOR_PATTERN = /[\s.-]/g;
const PHONE_COUNTRY_CODE_PATTERN = /^\+?84/;

// The vi-VN pattern in validator also lets "|" through (07|1234567); accept digits only.
export const LOCAL_PHONE_DIGITS_PATTERN = /^\d+$/;

export const toLocalPhone = (value: unknown): unknown =>
  typeof value === 'string'
    ? value.replace(PHONE_SEPARATOR_PATTERN, '').replace(PHONE_COUNTRY_CODE_PATTERN, '0')
    : value;
