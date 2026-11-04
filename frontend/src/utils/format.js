// Small formatting helpers shared by the dashboard components.
// Intl.NumberFormat formats numbers as currency (MDN Web Docs, n.d.).

// Amounts are South African rand (ZAR) because the tax estimate uses the SARS tables.
const amount = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value) {
  const n = Number(value);
  return `R${amount.format(Number.isFinite(n) ? n : 0)}`;
}

export function formatPercent(value) {
  const n = Number(value);
  return `${Number.isFinite(n) ? n : 0}%`;
}

// "2026-10" -> "Oct 2026" (UTC, so the label never shifts with the viewer's timezone).
export function formatMonth(key) {
  const [year, month] = String(key).split('-').map(Number);
  if (!year || !month) return String(key);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// References
// MDN Web Docs (n.d.) 'Intl.NumberFormat'. Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat (Accessed: 15 October 2026).
