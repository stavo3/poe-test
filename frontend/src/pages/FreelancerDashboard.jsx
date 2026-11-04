import { useEffect, useState } from 'react';
import client, { apiErrorMessage } from '../api/client';
import Alert from '../components/Alert';
import IncomeBarChart from '../components/IncomeBarChart';
import TaxDonut from '../components/TaxDonut';
import { formatMoney, formatPercent } from '../utils/format';
import { IconWallet, IconPercent, IconTrend, IconChart } from '../components/Icons';

// Freelancer income & tax dashboard: summary cards, charts and the bracket table.
// All figures come from GET /api/bookings/freelancer/tax-summary; the tax
// calculation itself is done on the server (src/utils/tax.js), never in the browser.
export default function FreelancerDashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  // Options sent to the API. taxYear is left undefined on the first load so the
  // server picks the SARS tax year that today's date falls in.
  const [taxYear, setTaxYear] = useState(undefined);
  const [ageGroup, setAgeGroup] = useState('under65');
  const [expenses, setExpenses] = useState('');

  useEffect(() => {
    let active = true;
    const params = { ageGroup };
    if (taxYear !== undefined) params.taxYear = taxYear;
    if (expenses !== '' && Number(expenses) >= 0) params.expenses = Number(expenses);

    client
      .get('/bookings/freelancer/tax-summary', { params })
      .then((res) => {
        if (active) {
          setSummary(res.data);
          setError('');
        }
      })
      .catch((err) => {
        if (active) setError(apiErrorMessage(err, 'Could not load your income summary.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [taxYear, ageGroup, expenses]);

  const years = summary?.supportedTaxYears || [];
  const shownYear = taxYear ?? summary?.taxYear ?? '';

  return (
    <div className="page">
      <div className="page-header">
        <span className="eyebrow">Freelancer</span>
        <h2>Income &amp; Tax Dashboard</h2>
        <p>Track your earnings and see an estimate of the income tax you may owe SARS (amounts in rand).</p>
      </div>

      <Alert type="error" message={error} />

      {loading && !summary && <p className="loading-text">Loading…</p>}

      {summary && (
        <>
          <section className="chart-card" aria-label="Tax estimate options">
            <div className="form-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <label htmlFor="taxYear">Tax year (1 March – end of February)</label>
                <select
                  id="taxYear"
                  data-testid="tax-year-select"
                  value={shownYear}
                  onChange={(e) => setTaxYear(Number(e.target.value))}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{`${y - 1}/${y}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ageGroup">Your age (decides the SARS rebate)</label>
                <select
                  id="ageGroup"
                  data-testid="age-group-select"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                >
                  <option value="under65">Under 65</option>
                  <option value="age65to74">65 to 74</option>
                  <option value="age75plus">75 and older</option>
                </select>
              </div>
              <div>
                <label htmlFor="expenses">Business expenses to deduct (R)</label>
                <input
                  id="expenses"
                  data-testid="expenses-input"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </section>

          <div className="stat-grid" data-testid="stat-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span className="stat-label">Gross income</span>
                <span className="stat-icon"><IconWallet /></span>
              </div>
              <strong data-testid="stat-gross">{formatMoney(summary.totalIncome)}</strong>
              <small>{summary.transactionCount} transaction(s)</small>
            </div>
            <div className="stat-card orange">
              <div className="stat-top">
                <span className="stat-label">Estimated tax</span>
                <span className="stat-icon"><IconPercent /></span>
              </div>
              <strong data-testid="stat-tax">{formatMoney(summary.estimatedTax)}</strong>
              <small>Effective rate {formatPercent(summary.effectiveRate)}</small>
            </div>
            <div className="stat-card green">
              <div className="stat-top">
                <span className="stat-label">Net income</span>
                <span className="stat-icon"><IconTrend /></span>
              </div>
              <strong data-testid="stat-net">{formatMoney(summary.netIncome)}</strong>
              <small>After expenses and estimated tax</small>
            </div>
            <div className="stat-card violet">
              <div className="stat-top">
                <span className="stat-label">Marginal rate</span>
                <span className="stat-icon"><IconChart /></span>
              </div>
              <strong data-testid="stat-marginal">{formatPercent(summary.marginalRate)}</strong>
              <small>Rate on your next earnings</small>
            </div>
          </div>

          {summary.transactionCount === 0 && (
            <p className="notice" data-testid="empty-state">
              You have no income yet. Once clients book your gigs, your earnings and estimated tax will appear here.
            </p>
          )}

          <div className="chart-grid">
            <section className="chart-card">
              <h3>Income per month</h3>
              <IncomeBarChart data={summary.monthly} />
            </section>
            <section className="chart-card">
              <h3>Net income vs estimated tax</h3>
              <TaxDonut netIncome={summary.netIncome} estimatedTax={summary.estimatedTax} />
            </section>
          </div>

          <section className="chart-card">
            <h3>How your tax was calculated</h3>
            <p>{summary.method}</p>
            {summary.taxableIncome !== undefined && (
              <ul className="calc-steps" data-testid="calc-steps">
                <li>Gross income: <strong>{formatMoney(summary.totalIncome)}</strong></li>
                <li>Less business expenses: <strong>{formatMoney(summary.expenses)}</strong></li>
                <li>Taxable income: <strong data-testid="stat-taxable">{formatMoney(summary.taxableIncome)}</strong></li>
                <li>Tax from the SARS brackets (table below): <strong>{formatMoney(summary.taxBeforeRebate)}</strong></li>
                <li>Less rebate for your age group: <strong>{formatMoney(summary.rebate)}</strong></li>
                <li>
                  Estimated tax payable: <strong>{formatMoney(summary.estimatedTax)}</strong>
                  {summary.belowTaxThreshold && ` (below the tax threshold of ${formatMoney(summary.taxThreshold)}, so no tax is payable)`}
                </li>
              </ul>
            )}
            <div className="table-wrap">
            <table className="table" data-testid="bracket-table">
              <thead>
                <tr>
                  <th>Income bracket</th>
                  <th>Rate</th>
                  <th>Your income in bracket</th>
                  <th>Tax</th>
                </tr>
              </thead>
              <tbody>
                {summary.breakdown.map((b) => (
                  <tr key={b.from}>
                    <td>
                      {formatMoney(b.from)} – {b.to === null ? 'and above' : formatMoney(b.to)}
                    </td>
                    <td>{formatPercent(Math.round(b.rate * 10000) / 100)}</td>
                    <td>{formatMoney(b.taxableInBracket)}</td>
                    <td>{formatMoney(b.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {summary.provisionalTax && (
              <p className="notice" data-testid="provisional-note">
                As a self-employed freelancer you are a provisional taxpayer: SARS expects an estimate and a payment by
                {' '}{summary.provisionalTax.firstPeriodEnds} (about half the year&apos;s tax, roughly{' '}
                {formatMoney(summary.provisionalTax.firstInstalmentIfIncomeHolds)} if your income stays at this level),
                the balance by the {summary.provisionalTax.secondPeriodEnds}, and an optional top-up by the{' '}
                {summary.provisionalTax.optionalThirdPaymentBy}.
              </p>
            )}
            <p className="disclaimer">{summary.disclaimer}</p>
          </section>
        </>
      )}
    </div>
  );
}
