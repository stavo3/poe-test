# HustleHub+ — Final Part (DevSecOps, Monitoring and Finalisation)

**INSY7314 — Group 17**

Group members: st10357922 - Atlegang Mogatusi · st10384480 - Olebogeng Dibodu · st10254932 - Lebohang Tsotetsi · st10367503 - Tebogo Thobejane

> Checklist of every assessment requirement and where it is implemented: **[REQUIREMENTS_CHECKLIST.md](REQUIREMENTS_CHECKLIST.md)**
>
> * GitHub Classroom50 repository: `<paste link>`
> * Forked repository used for SonarQube/Render (only if you forked, otherwise delete this line): `<paste link>`
> * Demonstration video: `<paste link>` (script in [demo-video/README.md](demo-video/README.md))
> * AI declaration: [section 14](#14-ai-declaration)

---

## 1. System overview

HustleHub+ is a freelancing marketplace that links clients who want to find and reserve services with freelancers who provide them. Beyond the marketplace, the platform tracks the financial side of every booking: it records a (simulated) transaction, calculates a freelancer's income, and **estimates their tax**, showing the result on a visual dashboard so freelancers can understand their earnings without extra bookkeeping tools.

| Layer | Technology |
|---|---|
| Client | React 18 + Vite, React Router, Axios, dependency-free SVG charts |
| API | Node.js 20, Express, Mongoose, JWT, bcrypt, Helmet, express-validator, xss, express-rate-limit — served over **HTTPS** |
| Database | MongoDB 7 |
| DevSecOps | GitHub Actions, ESLint (+ security plugin), **SonarQube**, Jest/Supertest, **Newman**, Vitest, **Playwright**, Docker, Docker Compose, nginx, **Grafana Cloud (Loki)** |

```
Browser ──http:8080──▶ nginx (client container) ──/api──▶ Express API (https:5000) ──▶ MongoDB
                         serves React build                logs/ app.log · security.log · access.log
```

---

## 2. Setup instructions

### Option A — Docker Compose (recommended, runs the whole stack)

Requires Docker Desktop (or Docker Engine + Compose v2).

```bash
cp .env.example .env              # then fill in EVERY value in .env (it is git-ignored, never commit it)
openssl rand -hex 32              # run it 3 times: use the output for JWT_SECRET, MONGO_PASSWORD and SEED_PASSWORD
                                  # MONGO_USER can be any simple name, e.g. hustlehub
docker compose up --build         # builds both images and starts mongo + api + client
docker compose run --rm api npm run seed   # first run only: demo data (WIPES the database)
```

`SEED_PASSWORD` must satisfy the password policy (≥ 8 characters with upper case, lower case, a digit and a symbol, e.g. `Aa1!` + the hex output). If you leave it empty the seed generates a random one and prints it once. **No password, secret or connection string is stored in the repository** — everything comes from `.env` (locally) or generated values/GitHub secrets (pipeline).

Open **http://localhost:8080**. Demo accounts created by the seed (password = your `SEED_PASSWORD`). The freelancer account also gets a year of demo income so the tax dashboard shows real brackets:

| Role | E-mail |
|---|---|
| Client | client@example.com |
| Freelancer | freelancer@example.com / freelancer2@example.com |
| Admin (monitoring) | admin@example.com |

Useful commands: `docker compose ps` (health status) · `docker compose logs -f api` · `docker compose down` (add `-v` to delete data and logs).

### Option B — Run locally without Docker

Requires Node 20+ and a MongoDB instance.

```bash
# API
cd "backend"
cp .env.example .env                               # set MONGO_URI and JWT_SECRET (openssl rand -hex 32); optional SEED_PASSWORD
mkdir certs && openssl req -nodes -new -x509 -keyout certs/key.pem -out certs/cert.pem -days 365
npm install
npm run seed                                       # optional demo data
npm run dev                                        # https://localhost:5000

# Client (new terminal)
cd "frontend"
npm install
npm run dev                                        # http://localhost:5173
```

(Open https://localhost:5000 once in the browser and accept the self-signed certificate, otherwise the client cannot reach the API.)

---

## 3. Feature descriptions

* **Authentication & RBAC** — register/login with JWT; roles `client`, `freelancer`, `admin`.
* **Gigs** — freelancers create, edit and delete their own gigs; everyone can browse and search.
* **Bookings** — clients book a gig; a confirmed booking is created together with a simulated payment transaction (`SIM-…` reference).
* **Income & tax dashboard (new)** — freelancers see gross income, estimated tax, net income, effective and marginal rate, a monthly income bar chart, a net-vs-tax donut chart and the per-bracket calculation (`/freelancer/dashboard`).
* **Monitoring summary (new)** — admins can read live counters of key events (`GET /api/monitoring/summary`).

---

## 4. Tax estimation component

**Where:** `backend/src/utils/tax.js` (logic and the official tables) → `GET /api/bookings/freelancer/tax-summary` (endpoint) → `FreelancerDashboard.jsx` (display). The tax is always calculated **on the server**, never in the browser, so it cannot be tampered with; the endpoint is authenticated, freelancer-only and validates every option it receives.

### 4.1 Research: how tax works for a South African freelancer

1. **Freelancers are self-employed.** No employer withholds PAYE, so the freelancer declares the income on their own tax return and is taxed as a natural person (resident individual) at the normal individual rates (SARS, n.d.a; Republic of South Africa, 1962).
2. **Taxable income = gross income − allowable business expenses.** Expenses "incurred in the production of income" are deductible (Income Tax Act 58 of 1962, s11(a)); personal spending is not (TaxTim, n.d.).
3. **Progressive brackets.** SARS publishes seven bands (18 % – 45 %) per tax year. Only the part of the income inside a band is taxed at that band's rate; SARS lists each band as "fixed amount + rate × income above the band start" (SARS, 2026).
4. **Rebates and the tax threshold.** The tax from the table is reduced by a *primary* rebate (everyone), a *secondary* rebate (65+) and a *tertiary* rebate (75+). Tax cannot go below zero, so no tax is payable under the "tax threshold" (SARS, 2026; SARS, n.d.a).
5. **Tax year.** 1 March – end of February. The **2027 tax year is 1 March 2026 – 28 February 2027**, with new tables announced in the Budget of 25 February 2026 (National Treasury, 2026; SARS, 2026). The platform's date logic uses South African time (UTC+2).
6. **Provisional tax.** People with income that has no PAYE withheld are provisional taxpayers: they estimate their taxable income and pay by the end of August (about half the year's tax) and by the end of February (the balance), with an optional third payment after year-end (SARS, 2023a; SARS, 2023b; TaxTim, n.d.).

### 4.2 The official tables used (2027 tax year, 1 March 2026 – 28 February 2027)

| Taxable income (R) | Rate of tax (R) |
|---|---|
| 1 – 245 100 | 18 % of taxable income |
| 245 101 – 383 100 | 44 118 + 26 % above 245 100 |
| 383 101 – 530 200 | 79 998 + 31 % above 383 100 |
| 530 201 – 695 800 | 125 599 + 36 % above 530 200 |
| 695 801 – 887 000 | 185 215 + 39 % above 695 800 |
| 887 001 – 1 878 600 | 259 783 + 41 % above 887 000 |
| 1 878 601 and above | 666 339 + 45 % above 1 878 600 |

| | Under 65 | 65 – 74 | 75 and older |
|---|---|---|---|
| Rebate (cumulative) | R17 820 | R17 820 + R9 765 | R17 820 + R9 765 + R3 249 |
| Tax threshold | R99 000 | R153 250 | R171 300 |

Source: SARS (2026), *Rates of Tax for Individuals* (page last updated 28 October 2026). The 2026 tax year table (1 March 2025 – 28 February 2026: first band R237 100, rebate R17 235, threshold R95 750) is also built in so the dashboard can show last year. **To add a new year, add one entry to `TAX_TABLES` in `tax.js`.**

### 4.3 The calculation (what the code does)

1. **Gross income** = sum of the freelancer's completed transactions *received inside the chosen tax year* (1 March – end of February, SA time).
2. **Taxable income** = gross − business expenses entered on the dashboard (never below 0).
3. **Tax before rebate** = Σ (taxable income inside each bracket × that bracket's rate). This equals SARS's "fixed amount + rate × excess" formula — the unit tests prove it for incomes in every bracket.
4. **Estimated tax** = max(0, tax before rebate − rebate for the selected age group). **Net income** = gross − expenses − estimated tax. **Effective rate** = tax ÷ taxable income. **Marginal rate** = rate on the next rand (0 % until the rebate is used up).
5. **Provisional tax guidance**: the dashboard shows the period end dates and roughly half of the estimated year's tax as the first instalment *if income stays at this level*.

**Worked example** — taxable income R300 000 (under 65, 2027): `44 118 + 26 % × (300 000 − 245 100) = 44 118 + 14 274 = R58 392` → less rebate R17 820 → **R40 572 tax**, net R259 428, effective rate 13.52 %, marginal rate 26 %. Income of R3 000 gives R540 before the rebate and **R0** after it (below the threshold) — which is why small demo transactions show no tax.

**Assumptions and limits (also stated on the dashboard):** the estimate covers income earned on this platform only; it ignores medical tax credits, retirement-annuity and donation deductions, capital gains, interest exemptions, VAT and income from other sources, and it is **not professional tax advice**.

### 4.4 Data security of the tax data

Calculation and filtering happen on the server; the endpoint requires a valid JWT with the freelancer role (clients get 403, anonymous users 401); a freelancer can only ever see their own transactions; query options (`taxYear`, `expenses`, `ageGroup`) are validated and rejected with 400 when invalid; NoSQL operators are stripped by the sanitiser; responses never include other users' data; income queries and the logins are written to the (redacted) audit logs.

**Frontend display:** four summary cards, a step-by-step calculation (gross → taxable → bracket tax → rebate → payable), a 12-month income bar chart for the tax year, a net-vs-tax donut chart, the SARS bracket table showing each bracket's contribution, and the provisional-tax note. Charts are plain SVG with accessible labels. Amounts are in rand (ZAR).

---

## 5. CI/CD pipeline (GitHub Actions)

Configuration: [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Runs automatically on every **push**, **pull request** and on demand.

| Job | Steps |
|---|---|
| **backend** (with a MongoDB service container) | install -> ESLint (+ security plugin) -> static-analysis report -> **unit + API integration tests (Jest/Supertest, with coverage)** -> **build** -> `npm audit` (fails on critical) |
| **frontend** | install -> ESLint -> static-analysis report -> **unit tests (Vitest, with coverage)** -> **build** (`vite build`) -> `npm audit` (fails on critical) |
| **sonarqube** (after backend + frontend) | downloads both coverage reports -> **SonarQube scan** -> **waits for the quality gate and fails the job if it fails** |
| **secret-scan** | `gitleaks` scans the repository files for passwords, API keys, tokens and private keys and **fails the pipeline** if one is committed (`.gitleaks.toml`) |
| **docker** (after backend + frontend) | validate compose -> build both images and start the stack (`--wait` for healthy) -> container proof + smoke test through nginx -> **Newman** runs the Postman collection against the running API -> seed data -> **Playwright** drives a real browser against the containers (login, access control, booking + transaction, tax dashboard) -> logs/evidence upload -> tear down |

**The pipeline fails** when ESLint reports errors, any unit/integration test fails, a build fails, the SonarQube quality gate fails, a critical dependency vulnerability is found, the containers do not become healthy, or a Newman/Playwright test fails. A failing step stops its job and turns the workflow red (no `continue-on-error` on any gating step).

**Evidence artifacts** uploaded on every run: `static-analysis-backend`, `static-analysis-frontend`, `backend-coverage`, `frontend-coverage`, `docker-evidence` (`docker compose ps`, health check, Newman JSON report, last security-log lines, container logs) and `playwright-report` (HTML report, screenshots, traces on failure).

**Required GitHub repository secrets** (Settings -> Secrets and variables -> Actions): `SONAR_TOKEN`, `SONAR_HOST_URL`. Optional (ships the CI run's logs to Grafana Cloud): `LOKI_URL`, `LOKI_USER`, `LOKI_API_KEY`. No secret is stored in the repository: the `docker` job generates a fresh JWT secret, MongoDB password and demo password for every run (masked in the logs), and Newman/Playwright receive the demo password from the job environment.

> Note: the pipeline uses `npm install` rather than `npm ci`. Run `npm install` once in each of the backend and frontend folders and commit the refreshed `package-lock.json` files (the frontend now has the new `@playwright/test` and `@vitest/coverage-v8` dev dependencies); you can then switch the workflow to `npm ci` for fully reproducible installs.

### 5.1 How the Newman (API integration) run works in the pipeline

1. The `docker` job writes a `.env` with freshly generated secrets and runs `docker compose up -d --build --wait`, so the real API (HTTPS, port 5000, backed by an authenticated MongoDB container) is running.
2. **Newman step** — runs `npm run test:api` in `backend`, which executes `scripts/run-newman.js`. That script loads the Postman collection (`postman/HustleHub.postman_collection.json`) and environment, injects the test password from `NEWMAN_PASSWORD` (generated per run; never stored in the repo), runs every request with its assertions against `https://localhost:5000/api` (`--insecure` because of the self-signed certificate) and **exits with a non-zero code if any assertion fails** — that turns the step, the job and the whole workflow red.
3. The JSON report is copied to `evidence/newman-report.json` and uploaded as part of the `docker-evidence` artifact (the report contains tokens, so it is git-ignored and only kept as a short-lived artifact).
4. Because Newman runs *before* the seed step, its registered users and the demo data do not interfere; the seed then resets the database for the Playwright tests.

**Run it yourself:** `docker compose up -d --build` (from the repository root), then `cd "backend" && npm install && npm run test:api`. Optional variables: `NEWMAN_PASSWORD` (otherwise a random one is generated) and `NEWMAN_BASE_URL`.

---

## 6. Static code analysis

Two layers run in the pipeline: **ESLint** (fast, fails the build on errors) and **SonarQube** (deeper analysis, quality gate, coverage).

### 6.1 ESLint

* **Config:** `backend/eslint.config.js` (with `eslint-plugin-security`: eval, unsafe regular expressions, non-literal file paths, object-injection patterns, child-process use) and `frontend/eslint.config.js` (`eslint-plugin-react` forbids `dangerouslySetInnerHTML`, unsafe `target="_blank"`; plus `eslint-plugin-react-hooks`).
* **Run locally:** `npm run lint` (fails on errors) and `npm run lint:report` (writes `reports/eslint-report.json`, `reports/eslint-report.txt` and `reports/static-analysis-summary.md`).
* **Reading the results:** *errors* are correctness problems or dangerous constructs and **fail the build**; *warnings* are quality/security smells (unused variables, `detect-object-injection`, non-literal regular expressions) that need human review. The user-input regular expression used for gig search is escaped before use (`gigController.js`), so a `detect-non-literal-regexp` warning there is a reviewed false positive.

### 6.2 SonarQube

* **Config:** [`sonar-project.properties`](sonar-project.properties) (sources, tests, exclusions, coverage report paths) and the `sonarqube` job in [`ci.yml`](.github/workflows/ci.yml).
* **What it analyses:** all backend and frontend source for bugs, vulnerabilities, security hotspots, code smells and duplication, plus test coverage from the Jest and Vitest LCOV reports.
* **Pipeline integration:** the job runs after the backend and frontend jobs, scans with `SonarSource/sonarqube-scan-action` and sets `sonar.qualitygate.wait=true`, so the pipeline **fails if the quality gate fails**.
* **Setup:** create the project on SonarQube Cloud (or your server), put its key in `sonar-project.properties`, and add the repository secrets `SONAR_TOKEN` and `SONAR_HOST_URL` (`https://sonarcloud.io` for SonarQube Cloud). If the Classroom50 repo blocks the connection, fork it, connect the fork, and put the fork link at the top of this README.
* **How to read the results:** *Bugs* = likely runtime defects; *Vulnerabilities* = exploitable weaknesses; *Security hotspots* = code that needs a manual security review (e.g. regular expressions, hashing, HTTP); *Code smells* = maintainability issues; *Coverage* and *Duplications* feed the quality gate (default "Sonar way": no new bugs/vulnerabilities, hotspots reviewed, coverage >= 80 % and duplication <= 3 % on new code).

**Latest SonarQube result** (fill in from your first green run, then add the screenshot `docs/evidence/sonarqube-dashboard.png`):

| Quality gate | Bugs | Vulnerabilities | Hotspots reviewed | Code smells | Coverage | Duplication |
|---|---|---|---|---|---|---|
| `<Passed/Failed>` | `<n>` | `<n>` | `<n %>` | `<n>` | `<n %>` | `<n %>` |

**Findings and remediation** (one row per finding you fixed or accepted):

| Finding (rule / file) | Severity | Action taken |
|---|---|---|
| `<e.g. S5852 regex / gigController.js>` | `<..>` | `<fixed / reviewed as safe because ...>` |

---

## 7. Docker & Docker Compose

* `backend/Dockerfile` — multi-stage build, production dependencies only, generates the self-signed TLS certificate, runs as the **non-root `node` user**, has a `HEALTHCHECK` on `/api/health`.
* `frontend/Dockerfile` — multi-stage build (Vite → **unprivileged nginx**), `HEALTHCHECK`, security headers (CSP, `X-Frame-Options`, `nosniff`, …) in `nginx.conf`, `/api` reverse-proxied to the API so the browser uses a single origin.
* `docker-compose.yml` — orchestrates `mongo`, `api` and `client`; waits for health (`depends_on: condition: service_healthy`); MongoDB is **not** published to the host and has **authentication enabled** (credentials from `.env`; the connection string is assembled from those values); logs persist in the `api-logs` volume; secrets come from `.env` (never committed); the compose file refuses to start without `JWT_SECRET`, `MONGO_USER` and `MONGO_PASSWORD`.
* `.dockerignore` files keep `node_modules`, `.env`, logs and tests out of the images.

---

## 8. Logging and monitoring

Implemented in `src/utils/logger.js` (+ `requestContext.js`, `morgan` access log). Output goes to the console (`docker logs`) **and** to JSON-lines files in `logs/` (persisted in the `api-logs` Docker volume; files rotate at 5 MB).

| What is logged | File / event | Why it matters |
|---|---|---|
| Login attempts — success, wrong password, unknown e-mail, blocked while locked | `security.log` — `login_success`, `login_failure`, `login_blocked` | Detects brute-force and credential-stuffing; provides an audit trail of who accessed the system and when. |
| Account lockouts | `account_locked` | Early warning that an account is under attack. |
| Registrations (and duplicate-e-mail attempts) | `user_registered`, `registration_rejected` | Shows sign-up abuse and account enumeration attempts. |
| Bookings | `booking_created` | Business audit trail; spikes can indicate booking spam. |
| Transactions | `transaction_recorded` (reference, amount) | Financial traceability and dispute investigation. |
| Authorisation failures | `access_denied` (wrong role), `token_rejected` (missing/invalid/expired JWT) | Reveals privilege-escalation attempts and stolen/forged tokens. |
| Errors | `app.log` — level `error` (with stack trace; the client never sees it) | Lets developers diagnose faults without leaking internals. |
| Every HTTP request | `access.log` (method, URL, status, time, request id) | Traffic analysis and incident reconstruction. |

Good practice built in: passwords, tokens, secrets and authorisation headers are **automatically redacted**; e-mail addresses are **masked** (`j***@example.com`); every request has an `X-Request-Id` that appears in the logs so one request can be traced across files.

**Cloud logging (Grafana Cloud Loki)** — when `LOKI_URL`, `LOKI_USER` and `LOKI_API_KEY` are set, `src/utils/cloudLogger.js` batches every already-redacted record and pushes it to Grafana Cloud (labels `app`, `env`, `log_type`; everything else stays in the JSON line and is queried with `| json`). Shipping failures are counted and dropped so logging can never crash the API. Setup, the importable dashboard ([`monitoring/grafana-dashboard.json`](monitoring/grafana-dashboard.json)) and the LogQL queries used for evidence are in [monitoring/README.md](monitoring/README.md). The pipeline can ship its own run to the same dashboard (`env="ci"`) through the optional `LOKI_*` secrets.

**Monitoring**

* `GET /api/health` — liveness + database state (HTTP 503 when the DB is down); used by Docker health checks.
* `GET /api/monitoring/summary` (admin only) — uptime and counters: logins, failures, lockouts, registrations, bookings, transactions, denied access, rejected tokens, errors.

View logs: `docker compose exec api sh -c "tail -n 20 logs/security.log"` or `docker compose logs -f api`.

---

## 9. Security implementation

Carried over from Part 2: bcrypt (12 rounds); JWT with short expiry; RBAC via `requireRole`; ownership checks in controllers; express-validator + custom `xss` sanitiser; `express-mongo-sanitize`; rate limiting on auth, booking and the whole API; Helmet with a strict CSP and HSTS; HTTPS only; generic error messages with no stack traces; 10 kB body limit.

### Own security features (beyond the minimum POE requirements)

> These are **our own** additions; none of them is a requirement in the POE document. Each is functional and covered by a test.

1. **Account lockout** — after `LOGIN_MAX_ATTEMPTS` (default 5) failed logins the account is locked for `LOCKOUT_MINUTES` (default 15) and returns HTTP 423 even for the correct password. Counters reset on success. (`authController.js`, `User.js`)
2. **Security audit logging with redaction and request correlation** — see section 8.
3. **Fail-fast configuration validation** — the API refuses to start without `MONGO_URI`/`JWT_SECRET`, and in production refuses a `JWT_SECRET` shorter than 32 characters. (`config/env.js`)
4. **Hardening fixes found during the final review** — public registration can no longer create `admin` accounts (privilege escalation); login does a dummy bcrypt comparison for unknown e-mails so response timing does not reveal which e-mails exist; a failed transaction rolls back its booking so data stays consistent; malformed JSON returns a clean 400.
5. **Container hardening** — non-root users, no published database port, nginx security headers, secrets only via environment.
6. **Pipeline security gates** — SonarQube quality gate, `eslint-plugin-security` and a critical-vulnerability `npm audit` all fail the build (see section 5).
7. **Log-shipping with redaction** — credentials are stripped and e-mails masked before any record leaves the server for Grafana Cloud (`cloudLogger.js`, `logger.js`).
8. **Secret hygiene and scanning** — no credential, token or connection string in the repository (`.env` only, generated per run in CI), MongoDB authentication enabled, a `gitleaks` secret scan that fails the pipeline, and git-ignored Newman reports (they contain tokens).

### Final security review

| Threat | How HustleHub+ addresses it |
|---|---|
| **Injection (NoSQL/SQL)** | MongoDB is accessed only through Mongoose models (parameterised queries — no string-built queries); `express-mongo-sanitize` strips `$`/`.` operator keys; express-validator enforces types (an object like `{"$gt":""}` for an e-mail is rejected with 400 — covered by a test); user text used in a regular expression (gig search) is escaped; IDs are validated with `isMongoId`. There is no SQL database, so classic SQL injection does not apply. |
| **Cross-site scripting (XSS)** | All input is stripped of HTML/script by the `xss` sanitiser before it reaches the database; React escapes output by default and the code base never uses `dangerouslySetInnerHTML` (enforced by an ESLint rule); API responses carry a `default-src 'none'` CSP and the client is served with a restrictive CSP (`script-src 'self'`). Tested with a `<script>` payload. |
| **Authentication weaknesses** | Strong password policy; bcrypt with per-user salt; JWT with expiry; rate-limited auth endpoints plus account lockout; identical error messages and timing for unknown e-mail vs wrong password; HTTPS + HSTS; secret length enforced in production. |
| **Access-control issues** | Role checks on every protected route (`requireRole`), resource-ownership checks for gig changes, admin role cannot be self-assigned, monitoring restricted to admins; every denial is logged (`access_denied`) and counted. Tested: client cannot create gigs, freelancer cannot book, other freelancer cannot edit a gig, non-admin cannot read monitoring. |
| **Sensitive data exposure** | Password hashes never serialised; secrets only in environment variables; logs redact credentials and mask e-mails; errors never include stack traces. |
| **Security misconfiguration / supply chain** | Helmet headers, `x-powered-by` removed, non-root containers, DB not exposed, `npm audit` and static analysis in the pipeline. |

**Known limitations (honest residual risks):** the JWT is kept in `localStorage` (vulnerable if an XSS bug is ever introduced — mitigated by CSP/sanitising; `httpOnly` cookies would be stronger); the Docker stack uses a self-signed certificate and an HTTP front door on localhost (use a real certificate/TLS terminator in production); in-memory rate limiting and counters reset on restart and are per-instance; payments are simulated.

---

## 10. Testing

| Suite | Command | Covers |
|---|---|---|
| Backend unit | `npm test` (in `backend`) | SARS tax logic (cross-checked against the official fixed-amount formula for every bracket, rebates, age groups, tax-year boundaries), logger (redaction, files, counters), env validation, XSS sanitiser |
| Backend API integration (Supertest) | included in `npm test` — needs MongoDB at `MONGO_URI_TEST` (default `mongodb://127.0.0.1:27017/hustlehub_test`; quick start: `docker run -d --name hh-test-mongo -p 27017:27017 mongo:7`) | auth, lockout, NoSQL injection, XSS, RBAC, ownership, bookings + transactions, tax summary, monitoring |
| Frontend unit (Vitest) | `npm test` (in `frontend`) | component/page tests + dashboard, charts, formatters |
| Frontend integration (Playwright) | `docker compose up --build -d && docker compose run --rm api npm run seed`, then set `E2E_PASSWORD` to your `SEED_PASSWORD` and run `npx playwright install chromium && npm run test:e2e` (in `frontend`) | real browser against the full stack: anonymous redirect, wrong-password error, role check, client books a gig and gets a `SIM-` transaction reference, freelancer income/tax dashboard (specs in `frontend/e2e/`) |
| API integration (Newman) | `npm run test:api` (in `backend`; API must be running, e.g. `docker compose up -d`) | Postman collection against the live HTTPS API (also runs in the pipeline) |

---

## 11. API reference (summary)

| Method & path | Access | Purpose |
|---|---|---|
| `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/profile` | public / public / authenticated | accounts |
| `GET/POST/PUT/DELETE /api/gigs…` | public read; freelancer write (owner only) | gigs |
| `POST /api/bookings` | client | create booking + simulated transaction |
| `GET /api/bookings/mine` · `/freelancer` · `/freelancer/income` | client / freelancer | bookings & income |
| `GET /api/bookings/freelancer/tax-summary` | freelancer | **new** — income, tax, net, charts data |
| `GET /api/health` | public | **new** — liveness + DB state |
| `GET /api/monitoring/summary` | admin | **new** — event counters |

## 12. Environment variables

| Variable | Default | Meaning |
|---|---|---|
| `MONGO_URI` | – (required) | MongoDB connection string (Docker: built from `MONGO_USER` / `MONGO_PASSWORD`) |
| `MONGO_USER` / `MONGO_PASSWORD` | – (required for Docker Compose) | MongoDB root credentials |
| `SEED_PASSWORD` | random, printed once | password of the demo accounts created by the seed |
| `NEWMAN_PASSWORD` / `NEWMAN_BASE_URL` | random / environment file | Newman test password and API URL |
| `E2E_PASSWORD` / `E2E_BASE_URL` | – (required) / `http://localhost:8080` | Playwright login password (= `SEED_PASSWORD`) and URL |
| `JWT_SECRET` | – (required, ≥ 32 chars in production) | JWT signing secret |
| `JWT_EXPIRES_IN` | `1h` | token lifetime |
| `CORS_ORIGIN` | allow all | comma-separated allowed origins |
| `LOGIN_MAX_ATTEMPTS` / `LOCKOUT_MINUTES` | `5` / `15` | account lockout |
| `AUTH_RATE_LIMIT_MAX` / `BOOKING_RATE_LIMIT_MAX` | `10` / `20` | rate limits |
| `LOG_DIR` | `<backend>/logs` | log directory |
| `LOKI_URL` / `LOKI_USER` / `LOKI_API_KEY` | – (cloud logging off) | Grafana Cloud Loki push URL, user ID and `logs:write` token |
| `LOKI_ENV` / `LOKI_FLUSH_MS` | `NODE_ENV` / `5000` | `env` label and batch interval |
| `TRUST_PROXY` | `0` | number of reverse-proxy hops |

## 13. Demonstration & evidence

* Demonstration video: `<paste link>` — script and checklist in [demo-video/README.md](demo-video/README.md).
* Evidence folder (screenshots of pipeline runs, SonarQube, Grafana, containers, tests): [docs/evidence/README.md](docs/evidence/README.md).
* Requirement-by-requirement checklist: [REQUIREMENTS_CHECKLIST.md](REQUIREMENTS_CHECKLIST.md).

## 14. AI declaration

> Edit this table so it is complete and truthful for **every** part of the submission where AI was used. Delete the rows that do not apply.

| Where AI was used | Tool | What it did | What we did ourselves |
|---|---|---|---|
| CI/CD workflow, `sonar-project.properties`, Newman and Playwright pipeline steps | Claude (Anthropic) | Drafted the pipeline configuration | `<reviewed, ran, fixed ...>` |
| Grafana Cloud (Loki) log shipping, dashboard JSON, `monitoring/README.md` | Claude (Anthropic) | Drafted `cloudLogger.js` integration notes and dashboard | `<created the Grafana account, tested ...>` |
| Playwright end-to-end specs | `<tool>` | `<...>` | `<...>` |
| `<other files / README sections>` | `<tool>` | `<...>` | `<...>` |

## References

Docker (n.d.) *Compose file reference*. Available at: https://docs.docker.com/compose/ (Accessed: 15 October 2026).
ESLint (n.d.) *Configuration files (flat config)*. Available at: https://eslint.org/docs/latest/use/configure/ (Accessed: 15 October 2026).
eslint-plugin-security (n.d.) *eslint-plugin-security*. Available at: https://github.com/eslint-community/eslint-plugin-security (Accessed: 15 October 2026).
GitHub (n.d.) *GitHub Actions documentation*. Available at: https://docs.github.com/en/actions (Accessed: 15 October 2026).
OWASP Foundation (n.d.) *Top 10:2021*. Available at: https://owasp.org/Top10/ (Accessed: 15 October 2026).
OWASP Foundation (n.d.) *Logging Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html (Accessed: 15 October 2026).
OWASP Foundation (n.d.) *Authentication Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html (Accessed: 15 October 2026).
South African Revenue Service (2026) *Rates of Tax for Individuals*. Available at: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/ (Accessed: 3 November 2026). [cited as SARS, 2026]
South African Revenue Service (n.d.a) *Personal Income Tax*. Available at: https://www.sars.gov.za/types-of-tax/personal-income-tax/ (Accessed: 3 November 2026).
National Treasury (2026) *Budget 2026 Tax Guide*. Available at: https://www.treasury.gov.za/documents/national%20budget/2026/sars/Budget%202026%20Tax%20guide.pdf (Accessed: 3 November 2026).
South African Revenue Service (2023a) *Provisional tax webinar presentation, 24 August 2023*. Available at: https://www.sars.gov.za/provisional-tax-webinar-presentation-24-august-2023 (Accessed: 3 November 2026).
South African Revenue Service (2023b) *Individual provisional taxpayers: second provisional tax return (IRP6)*. Available at: https://www.sars.gov.za/?p=88886 (Accessed: 3 November 2026).
TaxTim (n.d.) *What is provisional tax?* Available at: https://www.taxtim.com/za/guides/provisional-tax (Accessed: 3 November 2026).
Republic of South Africa (1962) *Income Tax Act 58 of 1962*, section 11(a) and the Fourth Schedule.
Gitleaks (n.d.) *gitleaks: detect and prevent secrets in git repos and files*. Available at: https://github.com/gitleaks/gitleaks (Accessed: 3 November 2026).
OWASP (n.d.) *Secrets Management Cheat Sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html (Accessed: 3 November 2026).
SonarSource (n.d.) *Analyzing source code - scanner configuration and quality gates*. Available at: https://docs.sonarsource.com/ (Accessed: 3 November 2026).
SonarSource (n.d.) *sonarqube-scan-action*. Available at: https://github.com/SonarSource/sonarqube-scan-action (Accessed: 3 November 2026).
Postman (n.d.) *Newman: run and test collections from the command line*. Available at: https://learning.postman.com/docs/collections/using-newman-cli/command-line-integration-with-newman/ (Accessed: 3 November 2026).
Microsoft (n.d.) *Playwright: continuous integration*. Available at: https://playwright.dev/docs/ci (Accessed: 3 November 2026).
Grafana Labs (n.d.) *Loki HTTP API - push*. Available at: https://grafana.com/docs/loki/latest/reference/loki-http-api/ (Accessed: 3 November 2026).
GitHub (n.d.) *Using secrets in GitHub Actions*. Available at: https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions (Accessed: 3 November 2026).
Express (n.d.) *Production best practices: security*. Available at: https://expressjs.com/en/advanced/best-practice-security.html (Accessed: 15 October 2026).
