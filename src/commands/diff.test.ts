import { parseEnvLines, computeDiff, DiffResult } from './diff';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('./add');
jest.mock('../crypto/encrypt');
jest.mock('../crypto/keyPair');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('parseEnvLines', () => {
  it('parses simple key=value pairs', () => {
    const result = parseEnvLines('FOO=bar\nBAZ=qux');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comment lines', () => {
    const result = parseEnvLines('# comment\nFOO=bar');
    expect(result).toEqual({ FOO: 'bar' });
  });

  it('ignores empty lines', () => {
    const result = parseEnvLines('\nFOO=bar\n\n');
    expect(result).toEqual({ FOO: 'bar' });
  });

  it('handles values with equals signs', () => {
    const result = parseEnvLines('URL=http://example.com?a=b');
    expect(result).toEqual({ URL: 'http://example.com?a=b' });
  });

  it('ignores lines without equals sign', () => {
    const result = parseEnvLines('INVALID_LINE\nFOO=bar');
    expect(result).toEqual({ FOO: 'bar' });
  });
});

describe('computeDiff', () => {
  it('detects added keys (in local, not in vault)', () => {
    const diff = computeDiff({ NEW_KEY: 'value' }, {});
    expect(diff.added).toContain('NEW_KEY');
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
  });

  it('detects removed keys (in vault, not in local)', () => {
    const diff = computeDiff({}, { OLD_KEY: 'value' });
    expect(diff.removed).toContain('OLD_KEY');
    expect(diff.added).toHaveLength(0);
  });

  it('detects changed values', () => {
    const diff = computeDiff({ FOO: 'new' }, { FOO: 'old' });
    expect(diff.changed).toContain('FOO');
    expect(diff.unchanged).toHaveLength(0);
  });

  it('detects unchanged keys', () => {
    const diff = computeDiff({ FOO: 'same' }, { FOO: 'same' });
    expect(diff.unchanged).toContain('FOO');
    expect(diff.changed).toHaveLength(0);
  });

  it('handles mixed diff correctly', () => {
    const local = { A: '1', B: 'changed', C: 'same' };
    const vault = { B: 'original', C: 'same', D: 'removed' };
    const diff = computeDiff(local, vault);
    expect(diff.added).toEqual(['A']);
    expect(diff.removed).toEqual(['D']);
    expect(diff.changed).toEqual(['B']);
    expect(diff.unchanged).toEqual(['C']);
  });
});
