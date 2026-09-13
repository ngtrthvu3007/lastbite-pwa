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
