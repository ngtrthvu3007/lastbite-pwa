export function isProduction(): boolean {
  return process.env.APP_ENV === 'production';
}
