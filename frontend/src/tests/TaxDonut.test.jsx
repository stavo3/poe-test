import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaxDonut from '../components/TaxDonut';

describe('TaxDonut', () => {
  it('describes the split in an accessible label and legend', () => {
    render(<TaxDonut netIncome={2670} estimatedTax={330} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', expect.stringContaining('R330.00'));
    expect(screen.getByText(/Net income R2,670\.00/)).toBeInTheDocument();
    expect(screen.getByText(/Estimated tax R330\.00/)).toBeInTheDocument();
  });

  it('renders without arcs when there is no income', () => {
    const { container } = render(<TaxDonut netIncome={0} estimatedTax={0} />);
    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });
});
