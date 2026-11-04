import { describe, it, expect } from 'vitest';
import { formatMoney, formatPercent, formatMonth } from '../utils/format';

describe('format helpers', () => {
  it('formats money as rand (ZAR) with two decimals', () => {
    expect(formatMoney(1234.5)).toBe('R1,234.50');
    expect(formatMoney(0)).toBe('R0.00');
  });

  it('falls back to zero for invalid numbers', () => {
    expect(formatMoney('abc')).toBe('R0.00');
    expect(formatPercent(undefined)).toBe('0%');
  });

  it('formats percentages', () => {
    expect(formatPercent(11)).toBe('11%');
  });

  it('formats month keys', () => {
    expect(formatMonth('2026-10')).toBe('Oct 2026');
    expect(formatMonth('garbage')).toBe('garbage');
  });
});
