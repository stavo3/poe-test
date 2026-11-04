import { formatMoney } from '../utils/format';

// Dependency-free SVG donut chart splitting gross income into net income and
// estimated tax. Uses stroke-dasharray on a circle: the visible arc length is
// proportional to the share of income (MDN Web Docs, n.d.).
export default function TaxDonut({ netIncome = 0, estimatedTax = 0 }) {
  const total = netIncome + estimatedTax;
  const radius = 15.9155; // circumference = 100, so dash values are percentages
  const taxPct = total > 0 ? (estimatedTax / total) * 100 : 0;
  const netPct = total > 0 ? 100 - taxPct : 0;

  return (
    <div className="donut-wrap">
      <svg
        viewBox="0 0 42 42"
        role="img"
        aria-label={`Income split: net ${formatMoney(netIncome)}, estimated tax ${formatMoney(estimatedTax)}`}
        className="donut-svg"
        data-testid="tax-donut"
      >
        <circle cx="21" cy="21" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="5.5" />
        {total > 0 && (
          <>
            <circle
              cx="21"
              cy="21"
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth="5.5"
              strokeDasharray={`${netPct} ${100 - netPct}`}
              strokeDashoffset="25"
            />
            <circle
              cx="21"
              cy="21"
              r={radius}
              fill="none"
              stroke="#f97316"
              strokeWidth="5.5"
              strokeDasharray={`${taxPct} ${100 - taxPct}`}
              strokeDashoffset={25 - netPct}
            />
          </>
        )}
      </svg>
      <ul className="legend">
        <li>
          <span className="swatch" style={{ background: '#10b981' }} /> Net income {formatMoney(netIncome)}
        </li>
        <li>
          <span className="swatch" style={{ background: '#f97316' }} /> Estimated tax {formatMoney(estimatedTax)}
        </li>
      </ul>
    </div>
  );
}

// References
// MDN Web Docs (n.d.) 'stroke-dasharray'. Available at: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray (Accessed: 15 October 2026).
