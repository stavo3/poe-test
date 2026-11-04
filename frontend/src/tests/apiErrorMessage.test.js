import { describe, it, expect } from 'vitest';
import { apiErrorMessage } from '../api/client';

describe('apiErrorMessage', () => {
  it('shows field-level validation messages instead of the generic "Validation failed."', () => {
    const err = {
      response: {
        data: {
          message: 'Validation failed.',
          errors: [
            { field: 'price', message: 'Price must be a positive number.' },
            { field: 'deliveryDays', message: 'Delivery days must be between 1 and 90.' },
          ],
        },
      },
    };
    expect(apiErrorMessage(err)).toBe(
      'Price must be a positive number. Delivery days must be between 1 and 90.'
    );
  });

  it('falls back to the server message when there are no field errors', () => {
    const err = { response: { data: { message: 'Invalid email or password.' } } };
    expect(apiErrorMessage(err)).toBe('Invalid email or password.');
  });

  it('returns the safe fallback (never raw error details) when there is no response', () => {
    expect(apiErrorMessage(new Error('connect ECONNREFUSED 127.0.0.1:5000'), 'Could not save gig.')).toBe(
      'Could not save gig.'
    );
  });
});
