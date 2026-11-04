# Demonstration video

**Link:** `<paste the video URL here and in the root README>`

Record the screen with narration (aim for 6-8 minutes). Show, in this order:

1. **Stack** – `docker compose ps` with `mongo`, `api`, `client` healthy; open http://localhost:8080.
2. **Authentication** – register a new account, wrong-password login (generic error), successful login; trigger the lockout (5 failures).
3. **Gig creation** – log in as a freelancer, create a gig, edit it.
4. **Booking and transaction recording** – log in as a client, book the gig, show the `SIM-…` transaction reference.
5. **Tax dashboard** – freelancer opens *Income & Tax*: gross, estimated tax, net, charts, bracket table; explain the method.
6. **Logging** – `docker compose exec api sh -c "tail -n 15 logs/security.log"` then the Grafana Cloud dashboard showing the same events.
7. **Pipeline** – GitHub Actions run (backend, frontend, sonarqube, docker jobs green), the SonarQube dashboard, the Playwright report.
8. **Security features** – lockout, redacted logs, role check (client opening the dashboard URL).
