import { describe, it, expect } from 'vitest';
import { renderTransferLedger } from '../src/transfers.js'; // To ensure we can load the module without crashing

describe('Data Formatting', () => {
  it('loads module successfully', () => {
    expect(typeof renderTransferLedger).toBe('function');
  });
});
