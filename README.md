# URL Shortener

A full-stack URL shortener built with React, Express, MongoDB, and Redis. It supports authenticated link management, custom slugs, expiration, redirect caching, and URL safety checks.

## Features

- Cookie-based authentication with access and refresh tokens
- URL and custom-slug validation
- Redis caching for successful redirects
- Negative caching for unknown slugs with a 30-second TTL
- MongoDB TTL index for expiring URLs, plus redirect-time expiration checks
- Paginated URL listing for authenticated users
- Edit destination and expiration; delete owned URLs
- Self-domain, private-network, and configurable domain-blocklist protection
- Optional Google Safe Browsing URL reputation checks
- Docker Compose setup for the backend, MongoDB, and Redis
- Automated tests using Vitest
- Load testing using Grafana k6

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | MongoDB 7 |
| Caching | Redis 7 |
| Testing | Vitest, Supertest |
| Load testing | Grafana k6 |
| Containerization | Docker Compose |

## Requirements

- Node.js 22+
- MongoDB 7+ and Redis 7+, or Docker Desktop
- npm
- k6 for load testing

## Local Setup

### 1. Backend

```bash
cd Backend
npm install
```

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Set unique random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. Never reuse the same secret for both.

For local MongoDB and Redis instances, configure `Backend/.env`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/urlshortener
REDIS_URL=redis://localhost:6379
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
BLOCKED_DOMAINS=
GOOGLE_SAFE_BROWSING_API_KEY=
```

`BLOCKED_DOMAINS` accepts comma-separated hostnames. `GOOGLE_SAFE_BROWSING_API_KEY` is optional. When configured, link creation performs a Google Safe Browsing check and fails closed if the reputation check cannot be completed.

Start the backend:

```bash
npm run dev
```

### 2. Frontend

Open another terminal:

```bash
cd Frontend
npm install
```

Create the frontend environment file:

```powershell
Copy-Item .env.example .env
```

Start the development server:

```bash
npm run dev
```

The default local addresses are:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

### 3. Docker Compose

Create `Backend/.env` from `Backend/.env.example` and configure the required JWT secrets.

From the repository root, run:

```bash
docker compose up --build -d
docker compose ps
```

The backend is exposed on port `3000`. MongoDB and Redis use named Docker volumes to preserve data across container recreation.

Check backend health:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## Link Management API

### Authentication and Access

- **Create (`POST /api/create`, `POST /api/create/custom`):** Authentication is optional. Anonymous users can create links; authenticated users can associate links with their accounts.
- **Redirect (`GET /:id`):** Public. Anyone with a valid short URL can access its destination.
- **List, edit, and delete:** Require authentication and should operate only on URLs owned by the authenticated user.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/create` | Create a short URL |
| `POST` | `/api/create/custom` | Create a URL with a custom slug |
| `GET` | `/:id` | Redirect to the original destination |
| `GET` | `/api/user/urls?page=1&limit=10` | List owned URLs with pagination |
| `PATCH` | `/api/user/urls/:id` | Update destination or expiration |
| `DELETE` | `/api/user/urls/:id` | Delete an owned URL |

### Pagination Response

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

To remove a link's expiration, send `"expires_at": null`. New expiration timestamps must be in the future.

## Redis Redirect Cache

- Positive cache entries contain the destination and expiration timestamp.
- Cache TTL is capped at the link's expiration time.
- Unknown slugs are negatively cached for 30 seconds.
- URL creation, editing, and deletion invalidate the relevant cache key.
- Redis failures fall back to MongoDB so ordinary redirects can continue.
- The MongoDB TTL index removes expired documents asynchronously; the redirect handler also checks expiration directly.

### Design Decisions

- Negative caching: Unknown slugs are cached for 30 seconds to reduce repeated MongoDB lookups for invalid URLs.

- Fail-closed URL safety checks: When a required safety or reputation check cannot be completed, link creation is rejected rather than proceeding without the check.

- Expiration-aware cache TTL: A cached redirect must not outlive its link's expiration time, preventing stale cache entries from bypassing expiration.

- Redis and MongoDB responsibilities: Redis accelerates repeated redirects; MongoDB remains the persistent store for URL records and metadata.

### Disabling Redis for Benchmarks

The Docker Compose configuration supports the `DISABLE_REDIS_CACHE` environment variable.

From PowerShell at the repository root:

```powershell
$env:DISABLE_REDIS_CACHE = "true"
docker compose up -d --force-recreate backend
```

Re-enable caching:

```powershell
$env:DISABLE_REDIS_CACHE = "false"
docker compose up -d --force-recreate backend
```

Wait for the backend to become healthy before starting a benchmark. Keep Redis running in both configurations; the disabled mode bypasses cache operations rather than stopping the Redis service.

## Automated Tests

The backend tests use Vitest and Supertest.

Run them from the backend directory:

```bash
cd Backend
npm test
```

The current suite contains **8 tests across 3 test files**:

| Test file | Tests | Coverage |
|---|---:|---|
| `test/validation.test.js` | 2 | URL validation |
| `test/urlSafety.test.js` | 4 | Domain and private-network safety checks |
| `test/urlApi.test.js` | 2 | Health endpoint and invalid-slug handling |
| **Total** | **8** | |

Successful URL creation and database-backed redirect integration tests are not yet covered by the automated suite. Add those against isolated test services before relying on the application for production traffic.

## Load Testing with Grafana k6

The load-test script is located at `loadtest/redirect.js`. It exercises a real short URL and checks that redirects return HTTP `302` with the expected `Location` header.

The current workload ramps up to 50 virtual users over approximately 65 seconds. The script checks:

- HTTP failure rate below 1%
- p95 response latency below 500 ms
- Zero redirect-check failures

### Run the Benchmark

Create a short URL while the backend is running:

```powershell
$created = Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/api/create" `
  -ContentType "application/json" `
  -Body '{"url":"https://example.com"}'

$env:BASE_URL = "http://localhost:3000"
$env:SLUG = ([uri]$created.shortUrl).Segments[-1].Trim('/')
```

With Redis enabled:

```powershell
$env:DISABLE_REDIS_CACHE = "false"
docker compose up -d --force-recreate backend

k6 run --summary-export=results/redis-enabled-controlled.json .\loadtest\redirect.js
```

With Redis disabled:

```powershell
$env:DISABLE_REDIS_CACHE = "true"
docker compose up -d --force-recreate backend

k6 run --summary-export=results/redis-disabled-controlled.json .\loadtest\redirect.js
```

Use the same `BASE_URL`, `SLUG`, k6 script, workload, machine, and service configuration for both runs. Reuse the same slug so the comparison measures the cache setting rather than differences in test data.

### Measured Benchmark Results

**Environment:** Local Docker Compose setup, with the backend, MongoDB, and Redis running in containers.

**Workload:** Up to 50 virtual users, approximately 65 seconds per run, redirecting to `https://example.com/`.

| Metric | Redis Enabled | Redis Disabled |
|---|---:|---:|
| Completed requests | 10,445 | 8,002 |
| Throughput | 160.43 req/s | 123.09 req/s |
| Average latency | 31.20 ms | 73.75 ms |
| Median latency | 18.61 ms | 49.14 ms |
| p95 latency | 105.92 ms | 225.84 ms |
| HTTP failure rate | 0% | 0% |
| Redirect checks passed | 100% | 100% |

### Observed Results

- Redis-enabled redirects had **57.7% lower average latency**.
- p95 latency was **53.1% lower** with Redis enabled.
- Observed throughput was **30.3% higher** with Redis enabled.
- Both runs completed with zero HTTP failures and zero redirect-check failures.

These are preliminary results from one run per configuration. They suggest Redis improves redirect performance in this local environment, but repeated runs are needed to establish how consistently the improvement occurs. Results may differ on other hardware and in production.

Raw k6 summaries are saved under `results/` for reference. Do not commit secrets or machine-specific artifacts unnecessarily.

## Security Notes

- Never commit `.env`, production secrets, or database credentials.
- Rotate credentials if they have been exposed publicly.
- Domain blocklists are only as effective as their configured entries.
- Configure a reputation provider and abuse monitoring for production use.
- Review cookie, CORS, rate-limit, and proxy settings for the deployed domain and HTTPS setup.

## Deployment

Deployment and CI/CD are future improvements. Before production deployment, configure production MongoDB and Redis URLs, unique JWT secrets, `APP_URL`, `FRONTEND_URL`, CORS, secure cookie settings, and HTTPS.

.