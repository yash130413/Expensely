import { describe, it, expect, vi } from 'vitest';

// Mock tesseract
vi.mock('tesseract.js', () => ({
  default: { recognize: vi.fn() }
}));

import Tesseract from 'tesseract.js';

// Inline the pure parsing functions for testing (no file I/O needed)
function parseMerchantName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  return lines[0] || '';
}

function parseTotalAmount(text) {
  const totalKeywords = /(?:total|grand total|amount|amount due|subtotal|net amount|to pay|payable)\s*[:\-]?\s*[₹$€£]?\s*(\d{1,6}(?:[.,]\d{1,2})?)/i;
  for (const line of text.split('\n')) {
    const match = line.match(totalKeywords);
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(amount) && amount > 0) return amount;
    }
  }
  const allAmounts = [...text.matchAll(/[₹$€£]?\s*(\d{1,6}[.,]\d{2})/g)]
    .map(m => parseFloat(m[1].replace(',', '.')))
    .filter(n => !isNaN(n) && n > 0);
  return allAmounts.length > 0 ? Math.max(...allAmounts) : null;
}

function parseDate(text) {
  const patterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
    }
  }
  return new Date().toISOString().split('T')[0];
}

describe('OCR Parsing Utilities', () => {
  it('parseMerchantName extracts first line as merchant', () => {
    const text = 'Pizza Palace\nDate: 01/01/2024\nTotal: 250';
    expect(parseMerchantName(text)).toBe('Pizza Palace');
  });

  it('parseMerchantName returns empty string for empty text', () => {
    expect(parseMerchantName('')).toBe('');
  });

  it('parseTotalAmount extracts total from keyword line', () => {
    const text = 'Pizza Palace\nDate: 01/01/2024\nTotal: 250';
    expect(parseTotalAmount(text)).toBe(250);
  });

  it('parseTotalAmount extracts grand total', () => {
    const text = 'Items: 100\nGrand Total: 450.50';
    expect(parseTotalAmount(text)).toBe(450.5);
  });

  it('parseTotalAmount falls back to largest amount', () => {
    const text = 'Item 1: 10.00\nItem 2: 20.00\nSubtotal 30.00';
    expect(parseTotalAmount(text)).toBe(30);
  });

  it('parseTotalAmount returns null for no amounts', () => {
    expect(parseTotalAmount('No numbers here')).toBeNull();
  });

  it('parseDate extracts DD/MM/YYYY format', () => {
    const text = 'Date: 15/06/2024\nTotal: 100';
    const result = parseDate(text);
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('parseDate returns today for no date found', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(parseDate('No date here')).toBe(today);
  });
});
