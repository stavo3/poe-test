import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FreelancerDashboard from '../pages/FreelancerDashboard';
import client from '../api/client';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client');
  return {
    ...actual,
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  };
});

const summary = {
  taxYear: 2027,
  supportedTaxYears: [2026, 2027],
  totalIncome: 300000,
  expenses: 0,
  taxableIncome: 300000,
  taxBeforeRebate: 58392,
  rebate: 17820,
  taxThreshold: 99000,
  belowTaxThreshold: false,
  estimatedTax: 40572,
  netIncome: 259428,
  effectiveRate: 13.52,
  marginalRate: 26,
  transactionCount: 8,
  monthly: [
    { month: '2026-08', income: 0 },
    { month: '2026-09', income: 100000 },
    { month: '2026-10', income: 200000 },
  ],
  breakdown: [
    { from: 0, to: 245100, rate: 0.18, taxableInBracket: 245100, tax: 44118 },
    { from: 245100, to: 383100, rate: 0.26, taxableInBracket: 54900, tax: 14274 },
    { from: 383100, to: null, rate: 0.31, taxableInBracket: 0, tax: 0 },
  ],
  provisionalTax: {
    firstPeriodEnds: '31 August 2026',
    secondPeriodEnds: 'end of February 2027',
    optionalThirdPaymentBy: 'end of September 2027',
    firstInstalmentIfIncomeHolds: 20286,
  },
  method: 'SARS progressive bracket estimate.',
  disclaimer: 'Approximate estimate only, not professional tax advice.',
};

describe('FreelancerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows income, tax and net income from the API', async () => {
    client.get.mockResolvedValue({ data: summary });
    render(<FreelancerDashboard />);

    expect(await screen.findByTestId('stat-gross')).toHaveTextContent('R300,000.00');
    expect(screen.getByTestId('stat-tax')).toHaveTextContent('R40,572.00');
    expect(screen.getByTestId('stat-net')).toHaveTextContent('R259,428.00');
    expect(screen.getByTestId('stat-marginal')).toHaveTextContent('26%');
    expect(client.get).toHaveBeenCalledWith('/bookings/freelancer/tax-summary', { params: { ageGroup: 'under65' } });
  });

  it('renders both charts and the bracket explanation', async () => {
    client.get.mockResolvedValue({ data: summary });
    render(<FreelancerDashboard />);

    expect(await screen.findByTestId('income-bar-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('income-bar')).toHaveLength(3);
    expect(screen.getByTestId('stat-taxable')).toHaveTextContent('R300,000.00');
    expect(screen.getByTestId('provisional-note')).toHaveTextContent('31 August 2026');
    expect(screen.getByTestId('tax-donut')).toBeInTheDocument();
    expect(screen.getByTestId('bracket-table')).toBeInTheDocument();
    expect(screen.getByText('SARS progressive bracket estimate.')).toBeInTheDocument();
    expect(screen.getByText('Approximate estimate only, not professional tax advice.')).toBeInTheDocument();
  });

  it('shows an empty state when there is no income', async () => {
    client.get.mockResolvedValue({
      data: { ...summary, totalIncome: 0, estimatedTax: 0, netIncome: 0, transactionCount: 0, effectiveRate: 0, marginalRate: 0 },
    });
    render(<FreelancerDashboard />);
    expect(await screen.findByTestId('empty-state')).toBeInTheDocument();
  });

  it('re-requests the summary with the chosen tax year, age group and expenses', async () => {
    client.get.mockResolvedValue({ data: summary });
    render(<FreelancerDashboard />);
    await screen.findByTestId('stat-gross');

    await userEvent.selectOptions(screen.getByTestId('age-group-select'), 'age65to74');
    await waitFor(() =>
      expect(client.get).toHaveBeenLastCalledWith('/bookings/freelancer/tax-summary', {
        params: { ageGroup: 'age65to74' },
      })
    );

    await userEvent.type(screen.getByTestId('expenses-input'), '1500');
    await waitFor(() =>
      expect(client.get).toHaveBeenLastCalledWith('/bookings/freelancer/tax-summary', {
        params: { ageGroup: 'age65to74', expenses: 1500 },
      })
    );

    await userEvent.selectOptions(screen.getByTestId('tax-year-select'), '2026');
    await waitFor(() =>
      expect(client.get).toHaveBeenLastCalledWith('/bookings/freelancer/tax-summary', {
        params: { ageGroup: 'age65to74', taxYear: 2026, expenses: 1500 },
      })
    );
  });

  it('explains when income is below the tax threshold', async () => {
    client.get.mockResolvedValue({
      data: { ...summary, totalIncome: 50000, taxableIncome: 50000, taxBeforeRebate: 9000, estimatedTax: 0, netIncome: 50000, belowTaxThreshold: true, effectiveRate: 0 },
    });
    render(<FreelancerDashboard />);
    expect(await screen.findByTestId('calc-steps')).toHaveTextContent('below the tax threshold of R99,000.00');
  });

  it('shows the backend error message when loading fails', async () => {
    client.get.mockRejectedValue({ response: { data: { message: 'Invalid or expired token.' } } });
    render(<FreelancerDashboard />);
    expect(await screen.findByTestId('alert-error')).toHaveTextContent('Invalid or expired token.');
  });
});
