# LastBite

LastBite is a Vietnamese food-surplus marketplace learning project. The app connects small merchants with nearby customers through real food posts, limited quantities, pickup windows, and atomic reservation flows.

Production deployment is planned through `infra/` and `k8s/`. The Docker Compose setup in this repository is for local development only.

## Apps

| App | Path | Stack | Local URL |
| --- | --- | --- | --- |
| API | `apps/lb-api` | NestJS GraphQL | <http://localhost:3000> |
| Customer | `apps/lb-customer` | Nuxt SSR/PWA | <http://localhost:5173> |
| Merchant | `apps/lb-merchant` | Vue SPA/PWA | <http://localhost:5174> |

## Local Development With Docker

Docker Compose starts the apps and local dependencies. Customer and merchant frontends support hot reload in containers. The API container is intentionally simple and does not hot reload; restart `lb-api` after backend code changes.

First run creates `docker/dev/.env` from `docker/dev/.env.example`.

### Linux/macOS

```sh
sh scripts/dev.sh all
```

Run a smaller target:

```sh
sh scripts/dev.sh infra
sh scripts/dev.sh api
sh scripts/dev.sh customer
sh scripts/dev.sh merchant
sh scripts/dev.sh frontend
```

The `api` target recreates `lb-api` without restarting the infra containers, which is useful because the API container does not hot reload.

Run detached:

```sh
sh scripts/dev.sh all -d
```

Restart the API after backend code changes:

```sh
docker compose --env-file docker/dev/.env restart lb-api
```

Optional one-time executable setup:

```sh
chmod +x scripts/dev.sh
./scripts/dev.sh all
```

### Windows PowerShell

```powershell
.\scripts\dev.ps1 all
```

Run a smaller target:

```powershell
.\scripts\dev.ps1 infra
.\scripts\dev.ps1 api
.\scripts\dev.ps1 customer
.\scripts\dev.ps1 merchant
.\scripts\dev.ps1 frontend
```

The `api` target recreates `lb-api` without restarting the infra containers, which is useful because the API container does not hot reload.

Run detached:

```powershell
.\scripts\dev.ps1 all -Detached
.\scripts\dev.ps1 all -d
```

Restart the API after backend code changes:

```powershell
docker compose --env-file docker/dev/.env restart lb-api
```

## Local Services

| Service | URL / Port |
| --- | --- |
| Postgres | `localhost:54320` |
| Redis | `localhost:63790` |
| RabbitMQ | `localhost:56720` |
| RabbitMQ Management | <http://localhost:15672> |
| MinIO API | <http://localhost:9000> |
| MinIO Console | <http://localhost:9001> |

Edit local Docker credentials and service URLs in `docker/dev/.env`.

## Environment Configuration

Local Docker reads shared service settings from `docker/dev/.env`. The first
dev script run copies this file from `docker/dev/.env.example` when it does not
exist yet.

The API also reads backend-only settings from `apps/lb-api/.env`. Start from
the example file:

```powershell
Copy-Item apps/lb-api/.env.example apps/lb-api/.env
```

Use `APP_ENV=development` when `lb-api` connects to the local Docker Postgres.
Use a non-development value, for example `APP_ENV=production`, when it connects
to Supabase or another hosted Postgres that requires SSL.

Required API variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string used by the API and Drizzle. |
| `REDIS_URL` | Redis connection string for OAuth state/session cache. |
| `AUTH_REFRESH_TOKEN_KEY` | Base64 encoded 32-byte key for encrypting Cognito refresh tokens. |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID. |
| `COGNITO_CLIENT_ID` | Backend app client ID. |
| `COGNITO_CLIENT_SECRET` | Backend app client secret. Keep this server-side only. |
| `COGNITO_DOMAIN` | Cognito Hosted UI domain, including `https://`. |
| `COGNITO_REDIRECT_URI` | Backend OAuth callback URL registered in Cognito. |
| `CUSTOMER_APP_URL` | Allowed customer app origin/return URL base. |
| `MERCHANT_APP_URL` | Allowed merchant app origin/return URL base. |

Generate a local refresh-token encryption key:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Put the printed value in `AUTH_REFRESH_TOKEN_KEY`. Do not commit `.env` files or
paste secrets into issue comments.

## AWS CLI And Profile Setup

Use a named AWS CLI profile for LastBite so local commands do not accidentally
use credentials from another project. Install AWS CLI v2 by following the
[official Windows installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), then confirm it is available:

```powershell
aws --version
```

Create a local development profile. The command prompts for an IAM access key,
secret access key, default region, and output format. Use an IAM principal with
only the permissions required for the task; never commit credentials or paste
them into `.env` files.

```powershell
aws configure --profile lastbite-dev
```

Use the profile explicitly for every AWS command and verify the active AWS
account before creating or modifying resources:

```powershell
aws sts get-caller-identity --profile lastbite-dev --region ap-southeast-1
```

The CLI stores profile configuration and credentials in the current user's AWS
configuration files. See AWS documentation for
[profiles and credential files](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
and [`sts get-caller-identity`](https://docs.aws.amazon.com/cli/latest/reference/sts/get-caller-identity.html).

## Cognito And Google OAuth

MVP auth is Google OAuth through Cognito. The browser starts at `lb-api`, the
API redirects to Cognito, Cognito redirects back to `lb-api`, then `lb-api`
sets LastBite's own `HttpOnly` session cookie. Customer and merchant frontends
must not store Cognito tokens.

Current local callback and app URLs:

| URL | Value |
| --- | --- |
| Cognito callback | `http://localhost:3000/auth/callback` |
| Customer app | `http://localhost:5173` |
| Merchant app | `http://localhost:5174` |
| Google redirect URI | `https://<cognito-domain>/oauth2/idpresponse` |

Google Auth Platform setup:

1. Create a `Web application` OAuth client.
2. Add the Cognito domain origin as an authorized JavaScript origin.
3. Add `https://<cognito-domain>/oauth2/idpresponse` as the authorized redirect URI.
4. Use scopes `openid`, `email`, and `profile`.
5. Copy the Google client ID and secret into Cognito as the `Google` identity provider.

Cognito setup:

1. Create a User Pool with Google as the only MVP identity provider.
2. Create a confidential backend app client with a client secret.
3. Enable authorization code flow only.
4. Allow scopes `openid`, `email`, and `profile`.
5. Register `http://localhost:3000/auth/callback` as a callback URL.
6. Register customer and merchant local URLs as logout URLs.
7. Copy the User Pool ID, app client ID, app client secret, and Hosted UI domain
   into `apps/lb-api/.env`.

The detailed auth design lives in `docs/features/authentication.md`.

## Database, Migrations, And Supabase

LastBite uses Drizzle for schema and migrations in `apps/lb-api`. Schema changes
start in `apps/lb-api/src/db/schema.ts`, generated migration files are written
to `apps/lb-api/drizzle`, and `DATABASE_URL` decides which Postgres database the
Drizzle command targets.

For local Docker Postgres from inside the API container:

```dotenv
APP_ENV=development
DATABASE_URL=postgresql://lastbite:change-me@postgres:5432/lastbite
```

For manual API commands from Windows against the Docker Postgres port:

```dotenv
APP_ENV=development
DATABASE_URL=postgresql://lastbite:change-me@localhost:54320/lastbite
```

For Supabase, use the pooled Postgres connection string from Supabase Project
Settings. Keep it in `apps/lb-api/.env` only:

```dotenv
APP_ENV=production
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres
```

If Supabase shows both direct and pooler URLs, prefer the shared/transaction
pooler URL for the app runtime. Use the same `DATABASE_URL` for Drizzle commands
only when you intend to migrate that Supabase database.

Generate a new migration after editing the Drizzle schema:

```powershell
cd apps/lb-api
npm run db:gen -- <short-change-name>
```

Run pending migrations against the database in `DATABASE_URL`:

```powershell
cd apps/lb-api
npm run db:migrate
```

Open Drizzle Studio for the same database:

```powershell
cd apps/lb-api
npm run db:studio
```

Use `db:push` only for throwaway local experiments. For project changes, commit
the generated migration instead.

## Manual App Setup

Use this when you want to run one app outside Docker.

### API

```sh
cd apps/lb-api
npm install
npm run start
```

### Customer

```sh
cd apps/lb-customer
npm install
npm run dev
```

### Merchant

```sh
cd apps/lb-merchant
npm install
npm run dev
```

## Build Checks

```sh
cd apps/lb-api
npm run build
```

```sh
cd apps/lb-customer
npm run build
```

```sh
cd apps/lb-merchant
npm run build
```

If dependencies change, run `npm install` in the changed app so `package-lock.json` is updated, then restart the Docker target.
