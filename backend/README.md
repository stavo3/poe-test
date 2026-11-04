HustleHub+ Backend — Part 2: Secure Stack
Start

Open the terminal
then type npm install
then type npm run dev

Runs on `https://localhost:5000` 

Security Decisions 

- bcrypt (12 rounds) for password hashing — salted per-user, slow by
  design to resist brute force.
- JWT for stateless auth; short expiry (`JWT_EXPIRES_IN`, default 1h)
  limits the damage window of a leaked token.
- RBAC via a small `requireRole(...roles)` middleware factory applied
  per-route, so the allowed roles are visible directly in the route file.
- Ownership checks are done in the controller (not just middleware)
  because they depend on the specific resource being accessed, not just the
  caller's role.
- express-validator for structural validation (types, lengths, enums)
  and a customxss-based sanitiser for content-level sanitisation
  (stripping HTML/script), applied globally so no route can forget it.
- express-mongo-sanitize strips `$`/`.` keys from user input to prevent
  MongoDB operator injection.
- express-rate-limit on `/api/auth/*` and `POST /api/bookings`
  specifically, since those are the endpoints most attractive to automated
  abuse (credential stuffing, booking spam), plus a generous baseline limiter
  on the whole API.
- helmet with an explicit `Content-Security-Policy` (`default-src
  'none'`) since this is a JSON-only API with nothing legitimate to load.
- Errors never leak stack traces; Mongoose `CastError`/`ValidationError`/
  duplicate-key errors are mapped to clean 400/409 responses.



---
**Part 3 update:** this project now includes the tax dashboard, logging/monitoring, Docker and CI/CD. See the repository root `README.md` and `REQUIREMENTS_CHECKLIST.md` for the full, final documentation.
