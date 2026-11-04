# Cloud logging with Grafana Cloud (Loki)

The API ships every log record (security audit events, application logs and the HTTP access log)
to **Grafana Cloud Loki** when three environment variables are set. Without them nothing is sent
and the local files in `logs/` keep working. Implementation: `backend/src/utils/cloudLogger.js`
(batching, `fetch` to the Loki push API, failures never crash the app). Passwords, tokens and
e-mail addresses are redacted/masked **before** a record is shipped.

## 1. One-off setup (about 10 minutes)

1. Create a free account at <https://grafana.com> and open your stack.
2. **Connections -> Loki** (or *My Account -> your stack -> Loki -> Details*). Copy:
   * the **URL** and append `/loki/api/v1/push` -> `LOKI_URL`
   * the **User** (numeric instance ID) -> `LOKI_USER`
3. **Access policies** -> create a policy with scope **`logs:write`** -> *Add token* -> copy it -> `LOKI_API_KEY`.
4. Put the three values in the root `.env` (Docker Compose) or the backend `.env` (local run).
   **Never commit them.** For the pipeline add them as GitHub repository secrets
   `LOKI_URL`, `LOKI_USER`, `LOKI_API_KEY`; the `docker` job then ships the CI run's logs with `env="ci"`.
5. Start the stack. The API logs `Cloud logging enabled (Grafana Cloud Loki)` on start-up.

## 2. Dashboard

Grafana -> **Dashboards -> New -> Import** -> upload [`grafana-dashboard.json`](grafana-dashboard.json)
and pick your Loki data source. Panels: login attempts, bookings/transactions, account lockouts,
access denied/rejected tokens, application errors, request rate and a live security-event log.

## 3. Generate events to screenshot

Failed login, successful login, create a gig, make a booking, request `/api/gigs/xyz` (error). Then
in **Explore** (Loki data source) run these LogQL queries:

| Purpose | Query |
|---|---|
| All security events | `{app="hustlehub-api", log_type="security"}` |
| Failed logins | `{app="hustlehub-api", log_type="security"} \| json \| event="login_failure"` |
| Account lockouts | `{app="hustlehub-api", log_type="security"} \| json \| event="account_locked"` |
| Bookings | `{app="hustlehub-api", log_type="security"} \| json \| event="booking_created"` |
| Transactions | `{app="hustlehub-api", log_type="security"} \| json \| event="transaction_recorded"` |
| Errors | `{app="hustlehub-api", log_type="app"} \| json \| level="error"` |
| Only the CI run | `{app="hustlehub-api", env="ci"}` |

Save screenshots of the dashboard and of these queries into `docs/evidence/` (`grafana-*.png`).

## References

Grafana Labs (n.d.) *Loki HTTP API - push*. Available at: https://grafana.com/docs/loki/latest/reference/loki-http-api/ (Accessed: 3 November 2026).
Grafana Labs (n.d.) *LogQL: Log query language*. Available at: https://grafana.com/docs/loki/latest/query/ (Accessed: 3 November 2026).
Grafana Labs (n.d.) *Grafana Cloud access policies*. Available at: https://grafana.com/docs/grafana-cloud/security-and-account-management/authentication-and-permissions/access-policies/ (Accessed: 3 November 2026).
