const {
  estimateTax,
  monthlyIncome,
  taxYearOf,
  taxYearRange,
  taxYearMonthlyIncome,
  TAX_BRACKETS,
  TAX_TABLES,
  SUPPORTED_TAX_YEARS,
} = require('../../src/utils/tax');

// SARS publishes each band as "fixed amount + rate x income above the band start".
// This independent implementation of SARS's own formula (2027 tax year) is used to
// cross-check the bracket-by-bracket algorithm.
const SARS_2027 = [
  [1878600, 666339, 0.45],
  [887000, 259783, 0.41],
  [695800, 185215, 0.39],
  [530200, 125599, 0.36],
  [383100, 79998, 0.31],
  [245100, 44118, 0.26],
  [0, 0, 0.18],
];
function sarsFormula(income) {
  for (const [start, fixed, rate] of SARS_2027) {
    if (income > start) return fixed + rate * (income - start);
  }
  return 0;
}
const rounded = (n) => Math.round(n * 100) / 100;

describe('estimateTax - official SARS 2027 tax table', () => {
  it('matches the SARS "fixed amount + rate" formula for incomes in every bracket', () => {
    [50000, 99000, 100000, 245100, 300000, 383100, 500000, 530200, 600000, 695800, 800000, 887000, 1000000, 1878600, 2500000].forEach(
      (income) => {
        const r = estimateTax(income, { taxYear: 2027 });
        expect(r.taxBeforeRebate).toBeCloseTo(rounded(sarsFormula(income)), 1);
        expect(r.estimatedTax).toBeCloseTo(Math.max(0, rounded(sarsFormula(income)) - 17820), 1);
      }
    );
  });

  it('has the published 2027 bands and rates', () => {
    expect(TAX_TABLES[2027].brackets.map((b) => b.upTo)).toEqual([245100, 383100, 530200, 695800, 887000, 1878600, Infinity]);
    expect(TAX_TABLES[2027].brackets.map((b) => b.rate)).toEqual([0.18, 0.26, 0.31, 0.36, 0.39, 0.41, 0.45]);
    expect(TAX_TABLES[2027].rebates).toEqual({ primary: 17820, secondary: 9765, tertiary: 3249 });
  });

  it('returns zero tax for zero income', () => {
    const r = estimateTax(0);
    expect(r.estimatedTax).toBe(0);
    expect(r.netIncome).toBe(0);
    expect(r.effectiveRate).toBe(0);
  });

  it('charges nothing up to the R99 000 tax threshold (under 65) and taxes the next rand', () => {
    expect(estimateTax(99000).estimatedTax).toBe(0);
    expect(estimateTax(99000).belowTaxThreshold).toBe(true);
    expect(estimateTax(100000).estimatedTax).toBe(180); // R1 000 x 18 %
    expect(estimateTax(98000).marginalRate).toBe(0);
    expect(estimateTax(100000).marginalRate).toBe(18);
  });

  it('worked example: R300 000 -> R40 572 tax (R58 392 before the R17 820 rebate)', () => {
    const r = estimateTax(300000);
    expect(r.taxBeforeRebate).toBe(58392);
    expect(r.rebate).toBe(17820);
    expect(r.estimatedTax).toBe(40572);
    expect(r.netIncome).toBe(259428);
    expect(r.effectiveRate).toBe(13.52);
    expect(r.marginalRate).toBe(26);
  });

  it('applies the 45 % top rate above R1 878 600', () => {
    expect(estimateTax(2500000).estimatedTax).toBe(928149);
    expect(estimateTax(2500000).marginalRate).toBe(45);
  });

  it('deducts business expenses before applying the brackets and never goes negative', () => {
    const r = estimateTax(300000, { expenses: 50000 });
    expect(r.taxableIncome).toBe(250000);
    expect(r.estimatedTax).toBe(estimateTax(250000).estimatedTax);
    expect(r.netIncome).toBe(250000 - r.estimatedTax + 0); // 300000 - 50000 - tax
    const over = estimateTax(1000, { expenses: 5000 });
    expect(over.taxableIncome).toBe(0);
    expect(over.estimatedTax).toBe(0);
    expect(over.expenses).toBe(1000);
  });

  it('uses the bigger rebates and thresholds for the 65+ and 75+ age groups', () => {
    expect(estimateTax(153250, { ageGroup: 'age65to74' }).estimatedTax).toBe(0);
    expect(estimateTax(153251, { ageGroup: 'age65to74' }).estimatedTax).toBeGreaterThan(0);
    expect(estimateTax(171300, { ageGroup: 'age75plus' }).estimatedTax).toBe(0);
    expect(estimateTax(171301, { ageGroup: 'age75plus' }).estimatedTax).toBeGreaterThan(0);
    expect(estimateTax(153250, { ageGroup: 'age65to74' }).rebate).toBe(17820 + 9765);
    expect(estimateTax(171300, { ageGroup: 'age75plus' }).rebate).toBe(17820 + 9765 + 3249);
  });

  it('uses the 2026 tax table (R237 100 first band, R17 235 rebate) when asked', () => {
    const r = estimateTax(300000, { taxYear: 2026 });
    // 18 % x 237 100 = 42 678; 26 % x 62 900 = 16 354; total 59 032 - 17 235 rebate
    expect(r.taxBeforeRebate).toBe(59032);
    expect(r.estimatedTax).toBe(41797);
    expect(r.taxYear).toBe(2026);
    expect(estimateTax(95750, { taxYear: 2026 }).estimatedTax).toBe(0);
  });

  it('never taxes more than the income earned and breakdown tax equals tax before rebate', () => {
    [1, 499.99, 99000, 245100, 7500000, 123456.78].forEach((income) => {
      const r = estimateTax(income);
      expect(r.estimatedTax).toBeLessThanOrEqual(income);
      const sum = r.breakdown.reduce((s, b) => s + b.tax, 0);
      expect(Math.round(sum * 100) / 100).toBeCloseTo(r.taxBeforeRebate, 1);
    });
  });

  it('rejects invalid input', () => {
    expect(() => estimateTax(-1)).toThrow(RangeError);
    expect(() => estimateTax(NaN)).toThrow(RangeError);
    expect(() => estimateTax('100')).toThrow(RangeError);
    expect(() => estimateTax(100, { expenses: -5 })).toThrow(RangeError);
    expect(() => estimateTax(100, { ageGroup: 'child' })).toThrow(RangeError);
  });

  it('has strictly increasing brackets in every supported table', () => {
    SUPPORTED_TAX_YEARS.forEach((y) => {
      const b = TAX_TABLES[y].brackets;
      for (let i = 1; i < b.length; i += 1) expect(b[i].upTo).toBeGreaterThan(b[i - 1].upTo);
    });
    expect(TAX_BRACKETS).toBe(TAX_TABLES[Math.max(...SUPPORTED_TAX_YEARS)].brackets);
  });
});

describe('tax-year helpers (1 March - end of February, South African time)', () => {
  it('maps dates to the right tax year', () => {
    expect(taxYearOf(new Date('2026-11-03T10:00:00Z'))).toBe(2027);
    expect(taxYearOf(new Date('2027-02-28T21:00:00Z'))).toBe(2027); // 23:00 SAST on 28 Feb
    expect(taxYearOf(new Date('2027-02-28T22:00:00Z'))).toBe(2028); // midnight SAST = 1 March
    expect(taxYearOf(new Date('2026-03-01T12:00:00Z'))).toBe(2027);
  });

  it('gives the exact range of a tax year', () => {
    const { start, end } = taxYearRange(2027);
    expect(start.toISOString()).toBe('2026-02-28T22:00:00.000Z');
    expect(end.toISOString()).toBe('2027-02-28T22:00:00.000Z');
  });

  it('buckets income into the 12 months of the tax year (March to February)', () => {
    const result = taxYearMonthlyIncome(
      [
        { amount: 100, createdAt: new Date('2026-03-10T10:00:00Z') },
        { amount: 50, createdAt: new Date('2026-10-20T10:00:00Z') },
        { amount: 25, createdAt: new Date('2026-10-31T23:00:00Z') }, // 01:00 SAST on 1 Nov
        { amount: 999, createdAt: new Date('2025-12-01T10:00:00Z') }, // previous tax year
      ],
      2027
    );
    expect(result).toHaveLength(12);
    expect(result[0]).toEqual({ month: '2026-03', income: 100 });
    expect(result[11].month).toBe('2027-02');
    expect(result.find((m) => m.month === '2026-10').income).toBe(50);
    expect(result.find((m) => m.month === '2026-11').income).toBe(25);
    expect(result.reduce((s, m) => s + m.income, 0)).toBe(175);
  });
});

describe('monthlyIncome', () => {
  it('returns a continuous list of months and sums income per month', () => {
    const now = new Date(Date.UTC(2026, 9, 15)); // 15 Oct 2026
    const result = monthlyIncome(
      [
        { amount: 100, createdAt: new Date(Date.UTC(2026, 9, 1)) },
        { amount: 50, createdAt: new Date(Date.UTC(2026, 9, 20)) },
        { amount: 75, createdAt: new Date(Date.UTC(2026, 7, 5)) },
        { amount: 999, createdAt: new Date(Date.UTC(2025, 0, 1)) }, // outside the window
      ],
      3,
      now
    );
    expect(result).toEqual([
      { month: '2026-08', income: 75 },
      { month: '2026-09', income: 0 },
      { month: '2026-10', income: 150 },
    ]);
  });
});
