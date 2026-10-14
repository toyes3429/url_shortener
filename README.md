# URL Shortener

A full-stack URL shortener built with React, Express, MongoDB, and Redis. It supports authenticated link management, custom slugs, expiration, redirect caching, and URL safety checks.

## Current features

- Cookie-based authentication with access and refresh tokens
- URL and custom-slug validation
- Redis caching for successful redirects
- Short-lived negative caching for unknown slugs
- MongoDB TTL index for expiring URLs, plus a redirect-time expiry check
- Paginated URL listing for the authenticated user
- Edit destination/expiration and delete owned URLs
- Self-domain, private-network, and configurable domain-blocklist protection
- Optional Google Safe Browsing URL reputation checks
- Docker Compose setup for the backend, MongoDB, and Redis
- Automated tests and a k6 load-test script

## Requirements

- Node.js 22+
- MongoDB 7+
- Redis 7+
- Docker Desktop (optional, for local services)
- k6 (only for the load test)

## Local setup

### 1. Backend

```bash
cd Backend
npm install
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Set unique random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. Do not reuse the same value for both.

Start MongoDB and Redis locally, then set these values in `Backend/.env`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/url_shortener
REDIS_URL=redis://localhost:6379
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
BLOCKED_DOMAINS=
GOOGLE_SAFE_BROWSING_API_KEY=
```

`BLOCKED_DOMAINS` accepts comma-separated hostnames. `GOOGLE_SAFE_BROWSING_API_KEY` is optional; when configured, link creation checks Google Safe Browsing. If that check cannot be completed, creation fails closed instead of silently skipping the reputation check.

Run the backend:

```bash
npm run dev
```

### 2. Frontend

```bash
cd Frontend
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env`.

The example frontend configuration uses `http://localhost:3000` for the backend and short-link origin.

### 3. Docker Compose

Create `Backend/.env` from `Backend/.env.example`, set the JWT secrets, then run from the repository root:

```bash
docker compose up --build -d
docker compose ps
```

The backend is exposed on port `3000`. MongoDB and Redis use named Docker volumes.

## Link management API

All link-management endpoints require authentication and only return or modify links owned by the current user.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/user/urls?page=1&limit=10` | List the current user's links with pagination |
| `PATCH` | `/api/user/urls/:id` | Update `url` and/or `expires_at` |
| `DELETE` | `/api/user/urls/:id` | Delete an owned link |

Pagination response shape:

```json
{
  "urls": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

To remove expiration from a link, send `"expires_at": null`. Expiration timestamps must be in the future when set.

## Redirect cache behavior

- Positive cache entries contain the destination and its expiration timestamp.
- Cache TTL is capped at the link's expiration time.
- Unknown slugs are cached for 30 seconds to reduce repeated MongoDB lookups.
- Link creation, edit, and deletion invalidate the relevant redirect-cache key.
- Redis errors fall back to MongoDB; cache failure should not prevent ordinary redirects.
- The MongoDB TTL index removes expired documents asynchronously. The redirect handler also checks expiration itself because TTL cleanup is not immediate.

The cache can be disabled temporarily for comparative benchmarks by setting `DISABLE_REDIS_CACHE=true` in `Backend/.env` and restarting the backend. Remove the setting or change it to `false` to re-enable Redis.

## Tests

From the repository root:

```bash
npm install
npm test
```

The tests cover the health endpoint, basic URL validation, and URL safety checks. Add integration tests against isolated MongoDB/Redis instances before relying on this project for production traffic.

## Load testing with k6

The test script sends traffic to both a real short slug and an unknown slug to measure positive and negative-cache behavior.

1. Start the app and create a short URL.
2. Warm the URL once in a browser or with `curl`.
3. From the repository root, run:

```bash
k6 run -e BASE_URL=http://localhost:3000 -e SLUG=your-real-slug -e MISSING_SLUG=loadtest-missing-123 loadtest/redirect.js
```

Repeat with Redis enabled and then with `DISABLE_REDIS_CACHE=true` in `Backend/.env`, restarting the backend between runs. Keep the same short URL, k6 stages, machine, and service configuration for both runs.

Record the actual results here after running the benchmark:

| Mode | Requests/sec | p95 latency | Failed requests | Machine/config |
| --- | ---: | ---: | ---: | --- |
| Redis enabled | Not measured yet | Not measured yet | Not measured yet | Fill in after run |
| Redis disabled | Not measured yet | Not measured yet | Not measured yet | Fill in after run |

Do not compare numbers from different machines or claim benchmark results that have not been measured. The k6 script has a short ramp-up, sustained load, and ramp-down; adjust its stages for longer tests.

## Security notes

- Never commit `.env`, production secrets, or database credentials.
- Rotate credentials if they were ever pushed to a public repository.
- Domain blocklists are only as good as the configured entries. For production abuse prevention, configure Safe Browsing or another reputation provider and monitor abuse reports.
- Cookie, CORS, and rate-limit settings must be reviewed for the deployed domain and proxy setup.

## Deployment

Deployment configuration and CI/CD are the next milestone. Before publishing, configure production MongoDB/Redis URLs, unique JWT secrets, `APP_URL`, `FRONTEND_URL`, CORS, and cookie settings for HTTPS.
