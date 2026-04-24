import * as fs from 'fs';
import { loadPolicy, savePolicy, setPolicyRule, removePolicyRule, enforcePolicy, Policy } from './policy';

jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

const samplePolicy: Policy = {
  version: 1,
  rules: {
    'DB_*': { pattern: 'DB_*', required: true, noEmpty: true },
    'API_KEY': { pattern: 'API_KEY', minLength: 16, regex: '^[A-Za-z0-9]+$' },
  },
};

beforeEach(() => {
  jest.resetAllMocks();
  mockFs.existsSync.mockReturnValue(true);
  mockFs.readFileSync.mockReturnValue(JSON.stringify(samplePolicy));
});

describe('loadPolicy', () => {
  it('returns empty policy when file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    const policy = loadPolicy();
    expect(policy.rules).toEqual({});
  });

  it('loads policy from file', () => {
    const policy = loadPolicy();
    expect(policy.rules['DB_*']).toBeDefined();
    expect(policy.rules['API_KEY'].minLength).toBe(16);
  });
});

describe('savePolicy', () => {
  it('writes policy to disk', () => {
    mockFs.existsSync.mockReturnValue(true);
    savePolicy(samplePolicy);
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      '.envault/policy.json',
      expect.stringContaining('DB_*'),
      'utf-8'
    );
  });
});

describe('setPolicyRule', () => {
  it('adds a new rule', () => {
    setPolicyRule('SECRET_*', { pattern: 'SECRET_*', noEmpty: true });
    expect(mockFs.writeFileSync).toHaveBeenCalled();
  });
});

describe('removePolicyRule', () => {
  it('removes existing rule', () => {
    const result = removePolicyRule('DB_*');
    expect(result).toBe(true);
  });

  it('returns false for non-existent rule', () => {
    const result = removePolicyRule('NONEXISTENT');
    expect(result).toBe(false);
  });
});

describe('enforcePolicy', () => {
  it('detects missing required key', () => {
    const entries = { API_KEY: 'abc1234567890123' };
    const violations = enforcePolicy(entries, samplePolicy);
    expect(violations.some(v => v.message.includes('DB_*'))).toBe(true);
  });

  it('detects empty value violation', () => {
    const entries = { DB_HOST: '' };
    const violations = enforcePolicy(entries, samplePolicy);
    expect(violations.some(v => v.key === 'DB_HOST' && v.message.includes('empty'))).toBe(true);
  });

  it('detects minLength violation', () => {
    const entries = { DB_HOST: 'localhost', API_KEY: 'short' };
    const violations = enforcePolicy(entries, samplePolicy);
    expect(violations.some(v => v.key === 'API_KEY' && v.message.includes('too short'))).toBe(true);
  });

  it('detects regex violation', () => {
    const entries = { DB_HOST: 'localhost', API_KEY: 'invalid-key!!!' };
    const violations = enforcePolicy(entries, samplePolicy);
    expect(violations.some(v => v.key === 'API_KEY' && v.message.includes('pattern'))).toBe(true);
  });

  it('passes valid entries', () => {
    const entries = { DB_HOST: 'localhost', DB_PASS: 'secret', API_KEY: 'validKey1234567890' };
    const violations = enforcePolicy(entries, samplePolicy);
    expect(violations.length).toBe(0);
  });
});
