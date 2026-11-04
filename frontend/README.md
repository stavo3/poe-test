HustleHub+ Frontend — Part 2

Open the terminal
type cd frontend
then type npm install      
then type npm run dev

Notes on Security/UX

- The JWT is stored in `localStorage` and attached via an Axios request
  interceptor; a 401 response clears it automatically so the app falls back
  to a logged-out state instead of looping on stale tokens.
- API error messages shown to the user always go through
  `apiErrorMessage()`, which only ever surfaces the backend's own
  human-readable `message` field — never raw error objects, stack traces, or
  HTTP internals.
- Invalid input (empty fields, bad email format) is caught client-side
  before a request is even sent, in addition to the server-side validation
  that is the actual security boundary.


---
**Part 3 update:** this project now includes the tax dashboard, logging/monitoring, Docker and CI/CD. See the repository root `README.md` and `REQUIREMENTS_CHECKLIST.md` for the full, final documentation.
