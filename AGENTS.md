# AGENTS.md

This file is the source of truth for agent behavior in the LastBite workspace.
The files under `docs/rules/` are only compatibility stubs that point back here.

## Project Context

LastBite is a portfolio/learning project for a Vietnamese food-surplus marketplace.
It connects small merchants with nearby customers through transparent, time-limited
food posts with real photos, limited quantities, dynamic pricing, and atomic
reservation.

Planned stack:

- `apps/lb-customer`: Nuxt SSR/PWA customer app.
- `apps/lb-merchant`: Vue SPA/PWA merchant app.
- `apps/lb-api`: NestJS GraphQL API.
- `apps/lb-reservation-engine`: Go service for atomic reservations.
- `apps/lb-broadcast-service`: Go WebSocket service for real-time updates.
- `apps/image-worker`: Go worker for async image processing.
- `proto/`: shared gRPC contracts.
- `k8s/`: Kubernetes manifests.
- `infra/`: Terraform for AWS/self-managed Kubernetes.

## Product Rules

- MVP auth is Google OAuth only. Do not add email/password, magic links, or extra
  identity flows unless explicitly requested.
- One account can act as both customer and merchant. Do not split customer and
  merchant into separate account types.
- Merchant permissions are ownership-based. Never rely on role checks alone.
- LastBite does not support in-app payment in the MVP. Buyers and merchants pay
  directly offline.
- Each merchant post is independent. Store post contact/address/details as a
  snapshot; later merchant profile edits must not rewrite old posts.
- Do not add bag templates, ratings, chat, coupons, KYC, Elasticsearch, or Zalo OA
  unless the task explicitly moves them into scope.
- Customer discovery is mobile-first: nearby posts, real photos, current price,
  remaining quantity, pickup window, search/filter, and map context matter.

## Architecture Rules

- Keep service boundaries explicit. Frontend apps talk to the NestJS GraphQL API;
  the API talks to Go services through gRPC where the design calls for it.
- Reservation correctness belongs in the Go reservation engine. Protect the last
  item with atomic Redis operations/locks and TTL-backed release behavior.
- Use RabbitMQ for async workflows already planned by the project: reservation
  expiry through TTL/DLX, image processing jobs, and notifications.
- Use Postgres as the source of truth for users, stores, posts, reservations, and
  search. Use Redis for reservation TTL/locks and cache, not durable state.
- Product images use presigned S3 uploads. Do not proxy binary image upload
  through the API unless explicitly requested.
- Use Leaflet + OpenStreetMap for maps unless the requirement changes.
- Keep generated code generated. Update `.proto` definitions first, then regenerate
  clients/servers with the project command when available.

## Coding Conventions

- Prefer simple, explicit, maintainable code over clever abstractions.
- Follow the existing file, naming, and module patterns once code exists. Do not
  introduce a new convention beside an existing one.
- Keep changes scoped to the current task. Avoid unrelated refactors and metadata
  churn.
- Reuse existing helpers, services, components, composables, DTOs, validators, and
  mappers before creating new ones.
- Keep public exports intentional. Do not export helpers unless another module
  actually needs them.
- Use TypeScript strictness where TypeScript is used. Prefer `unknown` over `any`,
  avoid unjustified assertions, and handle nullable values explicitly.
- Validate inputs at system boundaries: GraphQL resolvers, REST endpoints if any,
  gRPC handlers, queue consumers, and infrastructure-facing scripts.
- Use the project logger for persistent logs. Remove temporary debug logs before
  finishing.
- Do not suppress lint, type, build, or test failures without explaining why.

## Frontend Rules

- `apps/lb-customer` uses Nuxt SSR/PWA. Apply Nuxt conventions there.
- `apps/lb-merchant` uses Vue SPA/PWA. Apply Vue conventions there.
- Use framework folders, components, composables, and utilities according to the
  existing app pattern.
- Keep components focused on one responsibility. Extract only when it improves
  readability or avoids meaningful duplication.
- Handle loading, empty, error, disabled, submitting, and success states for
  user-facing async flows.
- Do not change UI styling, layout, spacing, colors, or visual design unless the
  task asks for it.
- Keep merchant UI simple and fast for small sellers; avoid SaaS-heavy dashboard
  complexity unless the feature requires it.
- Keep customer UI mobile-first, especially maps, nearby listings, reservation
  state, and real-time quantity/price updates.

## Backend Rules

- NestJS GraphQL resolvers/controllers stay thin: validate/normalize inputs, call
  services, and map responses.
- Services own business logic. Data access stays behind the project ORM,
  repository, or data-access pattern.
- Keep GraphQL response shapes stable unless a contract change is approved.
- Do not expose raw ORM entities or internal fields through API responses.
- Keep validation, authentication, authorization, not-found, conflict, and
  unexpected errors distinct.
- Never trust client-provided IDs, ownership, roles, merchant IDs, or permission
  flags. Re-check them server-side.
- Go handlers should pass `context.Context`, return errors explicitly, and avoid
  `panic` for normal control flow.

## Data And Integration Rules

- Database schema and migration changes require explicit approval before editing.
- Preserve existing data unless a migration/cleanup is explicitly requested.
- Select only fields needed by the use case and avoid N+1 query patterns.
- Add indexes only for real query patterns or clear uniqueness requirements.
- RabbitMQ exchange, queue, retry, TTL, and DLX behavior are contract-like; ask
  before changing topology or message semantics.
- gRPC and GraphQL contract changes must include compatible callers or a clear
  migration note.
- Infrastructure changes to Terraform, Kubernetes, secrets, networking, ingress,
  or deployment behavior require approval.

## Testing And Verification

- Add or update tests when behavior changes, a bug is fixed, or a regression risk
  is introduced.
- Test behavior and contracts, not implementation details.
- Prioritize backend service/API/reservation tests for concurrency, ownership,
  validation, and data-shape risks.
- Frontend tests are optional unless the task asks for them, relevant tests already
  exist, or the UI behavior has meaningful risk.
- Mock external services such as S3, RabbitMQ, OAuth, Web Push, maps, time, and
  network calls.
- Run the smallest relevant verification first, then broader lint/typecheck/build
  when the changed area warrants it.
- Do not claim verification passed unless the command actually ran.

## Approval Gates

Ask before:

- Changing database schema or migrations.
- Changing GraphQL, gRPC, queue message, or public API contracts.
- Changing authentication, authorization, ownership, or permission behavior.
- Adding any payment-related behavior.
- Changing secrets handling, deployment, CI/CD, Terraform, Kubernetes, or network
  infrastructure.
- Adding major dependencies.
- Changing broad architecture or service/module boundaries.
- Changing UI styling, layout, spacing, colors, or visual design.
- Deleting files, large blocks of code, or generated artifacts.

## Terminal Command Policy

- The user runs terminal commands. The agent must provide commands for the user
  to run instead of executing terminal commands directly.
- When verification or debugging needs terminal output, give the exact command
  and wait for the user to paste the result.
- Do not run shell, package-manager, git, test, build, lint, or dev-server
  commands unless the user explicitly changes this rule.

## Work Style

- If the user provides files, logs, screenshots, or test names, start there.
- If no files are provided, use fast search to find the smallest relevant area.
- Do not scan the whole repository by default.
- For multi-step requests, execute the requested order: review first, then fix,
  then refactor, then verify.
- For review requests, report findings first, ordered by severity, with file/line
  references when possible.
- Keep final responses concise and include changed files, verification, and known
  risks for non-trivial work.
