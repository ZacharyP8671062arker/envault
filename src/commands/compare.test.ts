import { compareVaults, formatCompareOutput, CompareResult } from './compare';
import * as add from './add';

jest.mock('./add');

const mockLoadVault = add.loadVault as jest.MockedFunction<typeof add.loadVault>;

describe('compareVaults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should identify keys only in vault A', () => {
    mockLoadVault
      .mockReturnValueOnce({ API_KEY: 'abc', SECRET: 'xyz' })
      .mockReturnValueOnce({ API_KEY: 'abc' });

    const result = compareVaults('vault-a.json', 'vault-b.json');
    expect(result.onlyInA).toContain('SECRET');
    expect(result.onlyInB).toHaveLength(0);
  });

  it('should identify keys only in vault B', () => {
    mockLoadVault
      .mockReturnValueOnce({ API_KEY: 'abc' })
      .mockReturnValueOnce({ API_KEY: 'abc', NEW_KEY: 'val' });

    const result = compareVaults('vault-a.json', 'vault-b.json');
    expect(result.onlyInB).toContain('NEW_KEY');
    expect(result.onlyInA).toHaveLength(0);
  });

  it('should identify keys with different values', () => {
    mockLoadVault
      .mockReturnValueOnce({ API_KEY: 'old-value' })
      .mockReturnValueOnce({ API_KEY: 'new-value' });

    const result = compareVaults('vault-a.json', 'vault-b.json');
    expect(result.diffValues).toContain('API_KEY');
    expect(result.matching).toHaveLength(0);
  });

  it('should identify matching keys', () => {
    mockLoadVault
      .mockReturnValueOnce({ API_KEY: 'same', DB_URL: 'same-db' })
      .mockReturnValueOnce({ API_KEY: 'same', DB_URL: 'same-db' });

    const result = compareVaults('vault-a.json', 'vault-b.json');
    expect(result.matching).toEqual(expect.arrayContaining(['API_KEY', 'DB_URL']));
    expect(result.diffValues).toHaveLength(0);
  });

  it('should handle empty vaults', () => {
    mockLoadVault
      .mockReturnValueOnce({})
      .mockReturnValueOnce({});

    const result = compareVaults('vault-a.json', 'vault-b.json');
    expect(result.onlyInA).toHaveLength(0);
    expect(result.onlyInB).toHaveLength(0);
    expect(result.diffValues).toHaveLength(0);
    expect(result.matching).toHaveLength(0);
  });
});

describe('formatCompareOutput', () => {
  it('should return identical message when no differences', () => {
    const result: CompareResult = { onlyInA: [], onlyInB: [], diffValues: [], matching: ['KEY'] };
    const output = formatCompareOutput(result);
    expect(output).toBe('Vaults are identical.');
  });

  it('should format differences with labels', () => {
    const result: CompareResult = {
      onlyInA: ['OLD_KEY'],
      onlyInB: ['NEW_KEY'],
      diffValues: ['CHANGED'],
      matching: []
    };
    const output = formatCompareOutput(result, 'staging', 'production');
    expect(output).toContain('Only in staging:');
    expect(output).toContain('  - OLD_KEY');
    expect(output).toContain('Only in production:');
    expect(output).toContain('  + NEW_KEY');
    expect(output).toContain('Different values:');
    expect(output).toContain('  ~ CHANGED');
  });
});
