import { cn } from '../lib/utils';

/**
 * Unit tests for the `cn` class-name utility.
 *
 * cn(...classes) joins truthy string arguments with a space,
 * filtering out any falsy values (undefined, false, empty string).
 *
 * Testing strategy: requirement-based.
 * Common case  → joins multiple valid class names.
 * Boundary case → single class, no arguments, exactly-falsy values.
 * Error case   → mix of valid strings and falsy values.
 */

describe('cn (class-name utility)', () => {
  // ── Common cases ─────────────────────────────────────────────────────────

  it('joins two class names with a space', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('joins multiple class names correctly', () => {
    expect(cn('btn', 'btn-primary', 'active')).toBe('btn btn-primary active');
  });

  // ── Boundary cases ────────────────────────────────────────────────────────

  it('returns a single class name unchanged', () => {
    expect(cn('only-class')).toBe('only-class');
  });

  it('returns an empty string when called with no arguments', () => {
    expect(cn()).toBe('');
  });

  // ── Falsy-value filtering ─────────────────────────────────────────────────

  it('filters out undefined values', () => {
    expect(cn('a', undefined, 'b')).toBe('a b');
  });

  it('filters out false values', () => {
    expect(cn('a', false, 'b')).toBe('a b');
  });

  it('filters out empty strings', () => {
    expect(cn('a', '', 'b')).toBe('a b');
  });

  it('returns an empty string when all arguments are falsy', () => {
    expect(cn(undefined, false)).toBe('');
  });
});
