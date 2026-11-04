// Runs the Postman collection with Newman (API integration tests).
//   npm run test:api
// The API must already be running (e.g. `docker compose up -d` from the repository root).
//
// No password is stored in the repository: the test password is taken from NEWMAN_PASSWORD,
// or a strong random one is generated for this run. NEWMAN_BASE_URL overrides the API URL
// (default comes from postman/HustleHub.postman_environment.json: https://localhost:5000/api).
// The JSON report is written to postman/newman-report.json (git-ignored, it contains tokens).
const crypto = require('crypto');
const path = require('path');
const newman = require('newman');

const password = process.env.NEWMAN_PASSWORD || `Aa1!${crypto.randomBytes(12).toString('hex')}`;
const envVar = [{ key: 'password', value: password }];
if (process.env.NEWMAN_BASE_URL) envVar.push({ key: 'baseUrl', value: process.env.NEWMAN_BASE_URL });

newman.run(
  {
    collection: path.join(__dirname, '..', 'postman', 'HustleHub.postman_collection.json'),
    environment: path.join(__dirname, '..', 'postman', 'HustleHub.postman_environment.json'),
    envVar,
    insecure: true, // the API uses a self-signed certificate in development / Docker
    reporters: ['cli', 'json'],
    reporter: { json: { export: path.join(__dirname, '..', 'postman', 'newman-report.json') } },
  },
  (err, summary) => {
    if (err) {
      console.error('Newman could not run:', err.message);
      process.exit(2);
    }
    const failures = summary.run.failures.length;
    console.log(failures === 0 ? 'Newman: all API tests passed.' : `Newman: ${failures} failure(s).`);
    process.exit(failures === 0 ? 0 : 1); // non-zero exit fails the pipeline
  }
);

// References
// Postman (n.d.) 'Newman: using Newman as a library'. Available at: https://learning.postman.com/docs/collections/using-newman-cli/newman-library/ (Accessed: 3 November 2026).
