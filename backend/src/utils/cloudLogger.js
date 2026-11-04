'use strict';
// Cloud log shipping to Grafana Cloud (Loki) - Part 3 "cloud-based logging".
//
// How it works
//  * logger.js hands every record (already redacted) to push().
//  * Records are batched in memory and sent to the Loki HTTP push API
//    (POST /loki/api/v1/push) using Node 20's built-in fetch - no extra package.
//  * Loki stream labels are kept low-cardinality: app, env, log_type
//    (app | security | access). Everything else (event, level, requestId ...)
//    stays inside the JSON line and is queried in Grafana with `| json`.
//
// Configuration (all optional - with nothing set this module does nothing):
//   LOKI_URL      full push URL, e.g. https://logs-prod-012.grafana.net/loki/api/v1/push
//   LOKI_USER     Grafana Cloud Loki user / instance ID (numeric)
//   LOKI_API_KEY  Grafana Cloud access policy token with the logs:write scope
//   LOKI_ENV      value of the "env" label (default: NODE_ENV)
//   LOKI_FLUSH_MS batch interval in ms (default 5000)
//
// Shipping must never break the application: failures are counted and dropped.

const MAX_BATCH = 100;
const MAX_BUFFER = 2000;

let buffer = [];
let timer = null;
const stats = { sent: 0, failed: 0, dropped: 0 };

function isEnabled(env = process.env) {
  return Boolean(env.LOKI_URL && env.LOKI_USER && env.LOKI_API_KEY);
}

// Loki wants a nanosecond Unix timestamp as a string.
function nowNs() {
  return (BigInt(Date.now()) * 1000000n).toString();
}

function push(logType, record) {
  if (!isEnabled()) return;
  if (buffer.length >= MAX_BUFFER) {
    buffer.shift();
    stats.dropped += 1;
  }
  buffer.push({ logType, ts: nowNs(), line: JSON.stringify(record) });

  if (buffer.length >= MAX_BATCH) {
    flush();
  } else if (!timer) {
    timer = setTimeout(flush, Number(process.env.LOKI_FLUSH_MS) || 5000);
    if (typeof timer.unref === 'function') timer.unref();
  }
}

function buildPayload(entries) {
  const byType = new Map();
  entries.forEach((e) => {
    if (!byType.has(e.logType)) byType.set(e.logType, []);
    byType.get(e.logType).push([e.ts, e.line]);
  });
  const streams = [];
  byType.forEach((values, logType) => {
    streams.push({
      stream: {
        app: 'hustlehub-api',
        env: process.env.LOKI_ENV || process.env.NODE_ENV || 'development',
        log_type: logType,
      },
      values,
    });
  });
  return { streams };
}

async function flush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!buffer.length || !isEnabled()) return;

  const entries = buffer;
  buffer = [];
  const auth = Buffer.from(`${process.env.LOKI_USER}:${process.env.LOKI_API_KEY}`).toString('base64');

  try {
    const res = await fetch(process.env.LOKI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify(buildPayload(entries)),
    });
    if (res.ok) {
      stats.sent += entries.length;
    } else {
      stats.failed += entries.length;
    }
  } catch (err) {
    // Network problem: drop the batch rather than retry forever / leak memory.
    stats.failed += entries.length;
  }
}

function getStats() {
  return { enabled: isEnabled(), buffered: buffer.length, ...stats };
}

function resetForTests() {
  buffer = [];
  if (timer) clearTimeout(timer);
  timer = null;
  stats.sent = 0;
  stats.failed = 0;
  stats.dropped = 0;
}

module.exports = { push, flush, isEnabled, getStats, buildPayload, resetForTests };

// References
// Grafana Labs (n.d.) Loki HTTP API - push. Available at: https://grafana.com/docs/loki/latest/reference/loki-http-api/ (Accessed: 3 November 2026).
// Grafana Labs (n.d.) Best practices - labels. Available at: https://grafana.com/docs/loki/latest/get-started/labels/bp-labels/ (Accessed: 3 November 2026).
// Node.js (n.d.) Fetch API. Available at: https://nodejs.org/api/globals.html#fetch (Accessed: 3 November 2026).
