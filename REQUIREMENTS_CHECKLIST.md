# Requirements checklist — HustleHub+ (INSY7314 final part)

Legend: ✅ implemented in the repo · 🟡 implemented, needs your evidence/values · ⬜ still to do by the team

| Rubric item | Status | Where |
|---|---|---|
| Tax & income dashboard | ✅ | `backend/src/utils/tax.js`, `GET /api/bookings/freelancer/tax-summary`, `FreelancerDashboard.jsx`; method explained in README section 4 |
| Tax method researched/referenced | ✅ | Official SARS 2026/27 tables, rebates, thresholds, provisional tax: README section 4 with references |
| CI/CD – backend unit + integration (Jest, Supertest, **Newman**) | ✅ | `backend` and `docker` jobs in `.github/workflows/ci.yml` |
| CI/CD – frontend unit (Vitest) + integration (**Playwright**) | ✅ | `frontend` job; `frontend/e2e/hustlehub.spec.js` run in the `docker` job |
| CI/CD – builds, security checks, failure handling | ✅ | build steps, `npm audit` (critical), SonarQube gate; no `continue-on-error` on gating steps |
| CI/CD – green run + failing-run screenshots | ⬜ | `docs/evidence/` (`pipeline-green.png`, `pipeline-failing.png`) |
| Static analysis – SonarQube in pipeline | ✅ | `sonar-project.properties`, `sonarqube` job |
| Static analysis – project created, secrets added, results + remediation | ⬜ | README section 6.2 table + `docs/evidence/sonarqube-dashboard.png` |
| Docker – separate Dockerfiles, Compose, working containers | ✅ | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` |
| Docker – proof, containers run in pipeline | 🟡 | `docker` job uploads `docker-evidence`; add `docker-compose-ps.png` |
| Logging – logins, bookings, transactions, errors | ✅ | `src/utils/logger.js`, README section 8 |
| Logging – cloud (Grafana) | 🟡 | `src/utils/cloudLogger.js`, `monitoring/`; create the Grafana account, set `LOKI_*`, screenshot the dashboard |
| Own security features (≥ 2) | ✅ | README section 9 "Own security features" |
| Security review | ✅ | README section 9 threat table (add in-text references to the table rows) |
| README complete and current | 🟡 | Fill the `<paste link>` placeholders, the SonarQube table and the AI declaration |
| 75+ meaningful commits, collaboration | ⬜ | Every member commits their own work with clear messages |
| Correct Classroom50 repo / fork link | ⬜ | Link at the top of the README |
| No hardcoded secrets | ✅ | No credential in the repo: `.env` only, MongoDB auth on, demo/test passwords generated, `gitleaks` job in CI. **Rotate any JWT secret that was ever in a committed or shared `.env`, and delete `newman-report.json` from the git history if it was pushed.** |
| Demo video (auth, gig creation, booking, transaction) | ⬜ | Record using [demo-video/README.md](demo-video/README.md), then paste the link in the README |
| References and attribution | 🟡 | README references + per-file references; add any new sources |
| AI declaration | 🟡 | README section 14 |
