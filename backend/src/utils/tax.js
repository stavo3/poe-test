'use strict';
// Income-tax estimation for freelancers, based on the OFFICIAL SARS tables
// (South African Revenue Service, "Rates of Tax for Individuals", last updated 28/10/2026).
//
// HOW SARS TAXES A FREELANCER (research summary - full references in the README)
//  * A freelancer is self-employed, so no employer withholds PAYE. The income is business
//    income taxed in the person's own hands as a natural person (resident individual).
//  * Taxable income = gross business income  -  allowable business expenses
//    (Income Tax Act 58 of 1962, s11(a): expenses incurred in the production of income).
//  * Tax is calculated on the taxable income with the PROGRESSIVE SARS table (7 bands,
//    18 % - 45 %). Only the part of the income that falls inside a band is taxed at that
//    band's rate. SARS publishes this as "fixed amount + rate x income above the band start".
//  * The tax calculated is then reduced by the REBATES (primary for everyone, secondary from
//    65, tertiary from 75). Tax can never go below zero, which is why nobody pays tax below
//    the "tax threshold" (R99 000 under 65 for the 2027 tax year).
//  * Tax years run 1 March - end of February. The 2027 tax year is 1 Mar 2026 - 28 Feb 2027.
//  * Self-employed people are provisional taxpayers: they estimate their taxable income and
//    pay in two instalments (31 August and end of February) plus an optional third.
//
// WHAT THIS MODULE DOES NOT DO (kept out of scope on purpose, stated on the dashboard)
//  * medical tax credits, retirement-annuity / donation deductions, capital gains, interest
//    exemptions, VAT and other income the freelancer may have outside this platform.
//
// To update for a new Budget, add a new entry to TAX_TABLES (taken from sars.gov.za).

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Amounts in rand. `upTo` is the top of the band (inclusive).
const TAX_TABLES = {
  // 2027 year of assessment: 1 March 2026 - 28 February 2027 (Budget 25 February 2026)
  2027: {
    label: '2027 tax year (1 March 2026 - 28 February 2027)',
    brackets: [
      { upTo: 245100, rate: 0.18 },
      { upTo: 383100, rate: 0.26 },
      { upTo: 530200, rate: 0.31 },
      { upTo: 695800, rate: 0.36 },
      { upTo: 887000, rate: 0.39 },
      { upTo: 1878600, rate: 0.41 },
      { upTo: Infinity, rate: 0.45 },
    ],
    rebates: { primary: 17820, secondary: 9765, tertiary: 3249 },
    thresholds: { under65: 99000, age65to74: 153250, age75plus: 171300 },
  },
  // 2026 year of assessment: 1 March 2025 - 28 February 2026 (same tables as 2025 and 2024)
  2026: {
    label: '2026 tax year (1 March 2025 - 28 February 2026)',
    brackets: [
      { upTo: 237100, rate: 0.18 },
      { upTo: 370500, rate: 0.26 },
      { upTo: 512800, rate: 0.31 },
      { upTo: 673000, rate: 0.36 },
      { upTo: 857900, rate: 0.39 },
      { upTo: 1817000, rate: 0.41 },
      { upTo: Infinity, rate: 0.45 },
    ],
    rebates: { primary: 17235, secondary: 9444, tertiary: 3145 },
    thresholds: { under65: 95750, age65to74: 148217, age75plus: 165689 },
  },
};

const SUPPORTED_TAX_YEARS = Object.keys(TAX_TABLES).map(Number).sort((a, b) => a - b);
const LATEST_TAX_YEAR = SUPPORTED_TAX_YEARS[SUPPORTED_TAX_YEARS.length - 1];
const AGE_GROUPS = ['under65', 'age65to74', 'age75plus'];

// Kept for backwards compatibility: the bands of the latest table.
const TAX_BRACKETS = TAX_TABLES[LATEST_TAX_YEAR].brackets;

const TAX_METHOD_DESCRIPTION =
  'Estimate based on the official SARS tax table for individuals. Taxable income = gross income from ' +
  'platform bookings minus the business expenses you enter. Tax is worked out with SARS\'s progressive ' +
  'brackets (only the part of your income inside a bracket is taxed at that bracket\'s rate) and is then ' +
  'reduced by your age-based rebate; tax cannot go below zero, so income under the tax threshold is not taxed. ' +
  'Freelancers are provisional taxpayers: SARS expects payments by the end of August and the end of February.';

const TAX_DISCLAIMER =
  'This is an approximate estimate for planning purposes only and is not professional tax advice. ' +
  'It ignores medical tax credits, retirement and donation deductions, other income and VAT.';

// ---------- tax-year helpers (South African time is UTC+2, no daylight saving) ----------
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

// Tax year (year of assessment) a date falls in. 2026-11-03 -> 2027, 2027-02-28 -> 2027, 2027-03-01 -> 2028.
function taxYearOf(date = new Date()) {
  const d = new Date(new Date(date).getTime() + SAST_OFFSET_MS);
  return d.getUTCMonth() >= 2 ? d.getUTCFullYear() + 1 : d.getUTCFullYear();
}

// Exact start (inclusive) and end (exclusive) instants of a tax year in SA time.
function taxYearRange(taxYear) {
  return {
    start: new Date(Date.UTC(taxYear - 1, 2, 1) - SAST_OFFSET_MS),
    end: new Date(Date.UTC(taxYear, 2, 1) - SAST_OFFSET_MS),
  };
}

// Table to use for a requested year: the exact table if we have it, otherwise the latest one.
function getTaxTable(taxYear) {
  return TAX_TABLES[taxYear] || TAX_TABLES[LATEST_TAX_YEAR];
}

function totalRebateFor(table, ageGroup) {
  const { primary, secondary, tertiary } = table.rebates;
  if (ageGroup === 'age75plus') return primary + secondary + tertiary;
  if (ageGroup === 'age65to74') return primary + secondary;
  return primary;
}

// Estimates the tax for one tax year.
//   grossIncome  income received in the tax year (rand, >= 0)
//   options.expenses   allowable business expenses (rand, >= 0, default 0)
//   options.ageGroup   'under65' (default) | 'age65to74' | 'age75plus'  -> decides the rebate
//   options.taxYear    year of assessment, e.g. 2027 (default: latest table)
function estimateTax(grossIncome, options = {}) {
  const { expenses = 0, ageGroup = 'under65', taxYear = LATEST_TAX_YEAR } = options;

  [grossIncome, expenses].forEach((v) => {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
      throw new RangeError('Income and expenses must be non-negative finite numbers.');
    }
  });
  if (!AGE_GROUPS.includes(ageGroup)) {
    throw new RangeError(`ageGroup must be one of: ${AGE_GROUPS.join(', ')}.`);
  }

  const table = getTaxTable(taxYear);
  const brackets = table.brackets;
  const taxableIncome = Math.max(0, grossIncome - expenses);

  let lower = 0;
  let taxBeforeRebate = 0;
  let bracketRate = brackets[0].rate;
  const breakdown = [];

  for (const bracket of brackets) {
    const upper = bracket.upTo;
    const inBracket = Math.max(0, Math.min(taxableIncome, upper) - lower);
    const bracketTax = inBracket * bracket.rate;

    breakdown.push({
      from: lower,
      to: upper === Infinity ? null : upper,
      rate: bracket.rate,
      taxableInBracket: round2(inBracket),
      tax: round2(bracketTax),
    });

    if (taxableIncome > lower) bracketRate = bracket.rate;
    taxBeforeRebate += bracketTax;
    lower = upper;
    if (taxableIncome <= upper) break;
  }

  taxBeforeRebate = round2(taxBeforeRebate);
  const rebate = totalRebateFor(table, ageGroup);
  const estimatedTax = round2(Math.max(0, taxBeforeRebate - rebate));
  const threshold = ageGroup === 'age75plus' ? table.thresholds.age75plus
    : ageGroup === 'age65to74' ? table.thresholds.age65to74 : table.thresholds.under65;

  // The next rand is only taxed once the rebate has been used up.
  const marginalRate = taxBeforeRebate >= rebate ? bracketRate : 0;

  return {
    taxYear: Object.keys(TAX_TABLES).includes(String(taxYear)) ? Number(taxYear) : LATEST_TAX_YEAR,
    taxYearLabel: table.label,
    ageGroup,
    totalIncome: round2(grossIncome),
    expenses: round2(Math.min(expenses, grossIncome)),
    taxableIncome: round2(taxableIncome),
    taxBeforeRebate,
    rebate,
    taxThreshold: threshold,
    belowTaxThreshold: estimatedTax === 0,
    estimatedTax,
    netIncome: round2(grossIncome - Math.min(expenses, grossIncome) - estimatedTax),
    effectiveRate: taxableIncome > 0 ? round2((estimatedTax / taxableIncome) * 100) : 0,
    marginalRate: round2(marginalRate * 100),
    breakdown,
  };
}

// Groups transactions into the last `months` calendar months (UTC), including
// months with no income so the chart has a continuous x-axis.
function monthlyIncome(transactions, months = 6, now = new Date()) {
  const buckets = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    buckets.push({ month: key, income: 0 });
  }

  for (const t of transactions) {
    const d = new Date(t.createdAt);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.find((b) => b.month === key);
    if (bucket) bucket.income = round2(bucket.income + t.amount);
  }

  return buckets;
}

// The 12 months of a tax year (March ... February, SA time) with the income received in each.
function taxYearMonthlyIncome(transactions, taxYear) {
  const buckets = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(Date.UTC(taxYear - 1, 2 + i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    buckets.push({ month: key, income: 0 });
  }

  for (const t of transactions) {
    const local = new Date(new Date(t.createdAt).getTime() + SAST_OFFSET_MS);
    const key = `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.find((b) => b.month === key);
    if (bucket) bucket.income = round2(bucket.income + t.amount);
  }

  return buckets;
}

module.exports = {
  TAX_TABLES,
  TAX_BRACKETS,
  SUPPORTED_TAX_YEARS,
  LATEST_TAX_YEAR,
  AGE_GROUPS,
  TAX_METHOD_DESCRIPTION,
  TAX_DISCLAIMER,
  estimateTax,
  monthlyIncome,
  taxYearOf,
  taxYearRange,
  taxYearMonthlyIncome,
  getTaxTable,
};

// REFERENCES
// South African Revenue Service (2026) Rates of Tax for Individuals. Available at: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/ (Accessed: 3 November 2026).
// South African Revenue Service (n.d.) Personal Income Tax. Available at: https://www.sars.gov.za/types-of-tax/personal-income-tax/ (Accessed: 3 November 2026).
// National Treasury (2026) Budget 2026 Tax Guide. Available at: https://www.treasury.gov.za/documents/national%20budget/2026/sars/Budget%202026%20Tax%20guide.pdf (Accessed: 3 November 2026).
// Republic of South Africa (1962) Income Tax Act 58 of 1962, s11(a) and Fourth Schedule.
