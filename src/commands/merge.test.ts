import { mergeVaults, MergeResult } from './merge';

describe('mergeVaults', () => {
  const base = {
    API_KEY: 'base-api-key',
    DB_HOST: 'localhost',
    SHARED_KEY: 'same-value',
  };

  const incoming = {
    API_KEY: 'new-api-key',
    NEW_VAR: 'new-value',
    SHARED_KEY: 'same-value',
  };

  it('adds keys present only in incoming', () => {
    const { result } = mergeVaults(base, incoming, 'ours');
    expect(result.added).toContain('NEW_VAR');
  });

  it('skips keys with identical values', () => {
    const { result } = mergeVaults(base, incoming, 'ours');
    expect(result.skipped).toContain('SHARED_KEY');
  });

  it('strategy ours keeps base value on conflict', () => {
    const { merged, result } = mergeVaults(base, incoming, 'ours');
    expect(merged['API_KEY']).toBe('base-api-key');
    expect(result.conflicts).not.toContain('API_KEY');
    expect(result.skipped).toContain('API_KEY');
  });

  it('strategy theirs overwrites base value on conflict', () => {
    const { merged, result } = mergeVaults(base, incoming, 'theirs');
    expect(merged['API_KEY']).toBe('new-api-key');
    expect(result.updated).toContain('API_KEY');
    expect(result.conflicts).toContain('API_KEY');
  });

  it('preserves all base keys not in incoming', () => {
    const { merged } = mergeVaults(base, incoming, 'ours');
    expect(merged['DB_HOST']).toBe('localhost');
  });

  it('includes newly added keys in merged output', () => {
    const { merged } = mergeVaults(base, incoming, 'ours');
    expect(merged['NEW_VAR']).toBe('new-value');
  });

  it('handles empty incoming vault gracefully', () => {
    const { merged, result } = mergeVaults(base, {}, 'ours');
    expect(merged).toEqual(base);
    expect(result.added).toHaveLength(0);
    expect(result.updated).toHaveLength(0);
  });

  it('handles empty base vault gracefully', () => {
    const { merged, result } = mergeVaults({}, incoming, 'ours');
    expect(merged).toEqual(incoming);
    expect(result.added).toHaveLength(3);
  });

  it('strategy interactive defaults to ours behavior', () => {
    const { merged } = mergeVaults(base, incoming, 'interactive');
    expect(merged['API_KEY']).toBe('base-api-key');
  });
});
