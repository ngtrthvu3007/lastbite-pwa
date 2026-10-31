# LastBite

LastBite is a Vietnamese food-surplus marketplace learning project. The app connects small merchants with nearby customers through real food posts, limited quantities, pickup windows, and atomic reservation flows.

Production deployment is planned through `infra/` and `k8s/`. The Docker Compose setup in this repository is for local development only.

## Apps

| App | Path | Stack | Local URL |
| --- | --- | --- | --- |
| API | `apps/lb-api` | NestJS GraphQL | <http://localhost:3000> |
| Web | `apps/lb-web` | Nuxt SSR/PWA for customer and merchant flows | <http://localhost:5173> |

## Local Development With Docker

Docker Compose starts the web app and local dependencies. The web app supports hot reload in containers. The API container is intentionally simple and does not hot reload; restart `lb-api` after backend code changes.

```sh
docker compose up --build
```

Run detached:

```sh
docker compose up --build -d
```

Restart the API after backend code changes:

```sh
docker compose restart lb-api
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

The local containers use the development defaults in `docker-compose.yml`. Override a value with a root `.env` file only when needed.

## Environment Configuration

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
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID. |
| `COGNITO_CLIENT_ID` | Backend app client ID. |
| `COGNITO_CLIENT_SECRET` | Backend app client secret. Keep this server-side only. |
| `COGNITO_DOMAIN` | Cognito Hosted UI domain, including `https://`. |
| `COGNITO_REDIRECT_URI` | Backend OAuth callback URL registered in Cognito. |
| `APP_URL` | Allowed LastBite web app origin/return URL base. |

Do not commit `.env` files or paste secrets into issue comments.

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
sets LastBite's own `HttpOnly` session cookie. The web app must not store
Cognito tokens.

Current local callback and web app URL:

| URL | Value |
| --- | --- |
| Cognito callback | `http://localhost:3000/auth/callback` |
| LastBite web app | `http://localhost:5173` |
| Google redirect URI | `https://<cognito-domain>/oauth2/idpresponse` |

Google Auth Platform setup:

1. Create a `Web application` OAuth client.
2. Add the Cognito domain origin as an authorized JavaScript origin.
3. Add `https://<cognito-domain>/oauth2/idpresponse` as the authorized redirect URI.
4. Use scopes `openid`, `email`, and `profile`.
5. Copy the Google client ID and secret into Cognito as the `Google` identity provider.

Cognito (User Pool, domain, `Google` identity provider, and the confidential
backend app client) is managed by Terraform in `infra/cognito/`. Do not create or
edit it by hand in the console. Change it in code and `plan`/`apply` (see
`docs/terraform-guide.md`). Copy the User Pool ID, app client ID, app client
secret, and Hosted UI domain into `apps/lb-api/.env` with
`terraform output` (add `-raw COGNITO_CLIENT_SECRET` for the secret).

The detailed auth design lives in `docs/features/authentication.md`, and the
step-by-step setup in `docs/features/cognito-google-setup.md`.

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

Drizzle has no "down" migrations. To undo a change, write a new migration. The
`db:revert` script (`drizzle-kit drop`) only deletes a generated migration file,
it does not roll back a database. More detail, in Vietnamese: `docs/database.md`.

## Manual App Setup

Use this when you want to run one app outside Docker.

### API

```sh
cd apps/lb-api
npm install
npm run start
```

### Web app

```sh
cd apps/lb-web
npm install
npm run dev
```

## Build Checks

```sh
cd apps/lb-api
npm run build
```

```sh
cd apps/lb-web
npm run build
```

If dependencies change, run `npm install` in the changed app so `package-lock.json` is updated, then restart the Docker target.

## Contributing

- `main` and `dev` are protected: branch off `dev`, open a pull request, and get one approval.
- CI runs lint, prettier, tests, and build for each app that changed; the checks must pass before merging.
- CI details and the PR workflow: [docs/ci.md](docs/ci.md).
