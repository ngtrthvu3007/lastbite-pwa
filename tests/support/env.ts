// Reads .env from the working directory (Node 20.12+). Without it, export the variables in the shell.
try {
  process.loadEnvFile();
} catch {
  // No .env file.
}

export const env = {
  webUrl: process.env.WEB_URL ?? 'http://localhost:5173',
  apiUrl: process.env.API_URL ?? 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL ?? '',
  // Set it to the same value as the API's COOKIE_DOMAIN, or leave it empty when the API has none.
  cookieDomain: process.env.COOKIE_DOMAIN ?? '',
};
