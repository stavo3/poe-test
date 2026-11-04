import { formatMoney, formatMonth } from '../utils/format';

export default function IncomeBarChart({ data = [] }) {
  const width = 480;
  const height = 240;
  const pad = { top: 16, right: 12, bottom: 34, left: 52 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const max = Math.max(1, ...data.map((d) => d.income));
  const barSlot = data.length ? innerW / data.length : innerW;
  const barW = Math.min(46, barSlot * 0.6);
  const ticks = [...new Set([0, 0.5, 1].map((f) => Math.round(max * f)))];

  const summary = data.map((d) => `${formatMonth(d.month)}: ${formatMoney(d.income)}`).join(', ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Monthly income bar chart. ${summary}`}
      className="chart-svg"
      data-testid="income-bar-chart"
    >
      <defs>
        <linearGradient id="hh-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>

      {ticks.map((t) => {
        const y = pad.top + innerH - (t / max) * innerH;
        return (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
              {t}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const h = (d.income / max) * innerH;
        const x = pad.left + i * barSlot + (barSlot - barW) / 2;
        const y = pad.top + innerH - h;
        return (
          <g key={d.month}>
            <rect x={x} y={y} width={barW} height={h} rx="6" fill="url(#hh-bar)" data-testid="income-bar">
              <title>{`${formatMonth(d.month)}: ${formatMoney(d.income)}`}</title>
            </rect>
            <text x={x + barW / 2} y={height - 12} textAnchor="middle" fontSize="11" fill="#475569">
              {formatMonth(d.month).split(' ')[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
