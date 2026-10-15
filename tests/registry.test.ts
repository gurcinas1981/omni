import { describe, it, expect } from 'vitest';
import { NODES } from '@/lib/registry/nodes';
import { OMNI_SYMBOLS, SYMBOL_BY_ID } from '@/lib/registry/symbols';

describe('OMNI symbol library ↔ categories', () => {
  it('library has 32 symbols in an 8×4 atlas with unique ids', () => {
    expect(OMNI_SYMBOLS).toHaveLength(32);
    expect(new Set(OMNI_SYMBOLS.map((s) => s.id)).size).toBe(32);
    expect(OMNI_SYMBOLS.every((s) => s.col >= 0 && s.col < 8 && s.row >= 0 && s.row < 4)).toBe(true);
  });
  it('every category is represented by exactly one, distinct library symbol', () => {
    for (const n of NODES) expect(SYMBOL_BY_ID[n.symbol], n.id).toBeDefined();
    expect(new Set(NODES.map((n) => n.symbol)).size).toBe(NODES.length);
  });
  it('the Ω represents OMNISYNAPSE and the fox represents the FOX ecosystem', () => {
    expect(NODES.find((n) => n.id === 'omnisynapse')?.symbol).toBe('omega');
    expect(NODES.find((n) => n.id === 'fox')?.symbol).toBe('fox');
  });
});
