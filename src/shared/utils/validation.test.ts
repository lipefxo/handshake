import { describe, expect, it } from 'vitest';
import { sanitizeRichText, sanitizeText, validateUrl } from './validation';

describe('validation utilities', () => {
  it('strips tags from plain text fields', () => {
    expect(sanitizeText('<img src=x onerror=alert(1)>Hello')).toBe('Hello');
  });

  it('allows basic rich text formatting without event handlers', () => {
    expect(sanitizeRichText('<strong onclick="alert(1)">Hello</strong>')).toBe('<strong>Hello</strong>');
  });

  it('rejects javascript URLs', () => {
    expect(validateUrl('javascript:alert(1)').isValid).toBe(false);
  });
});
