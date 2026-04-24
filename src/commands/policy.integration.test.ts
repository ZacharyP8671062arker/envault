import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadPolicy, savePolicy, enforcePolicy, setPolicyRule } from './policy';

const TMP_DIR = path.join(os.tmpdir(), `envault-policy-test-${Date.now()}`);
const POLICY_PATH = path.join(TMP_DIR, '.envault', 'policy.json');

beforeEach(() => {
  fs.mkdirSync(path.dirname(POLICY_PATH), { recursive: true });
  process.chdir(TMP_DIR);
});

afterEach(() => {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
});

describe('policy integration', () => {
  it('saves and loads a policy rule end-to-end', () => {
    savePolicy({ version: 1, rules: {} });
    setPolicyRule('DB_URL', { pattern: 'DB_URL', required: true, noEmpty: true });

    const policy = loadPolicy();
    expect(policy.rules['DB_URL']).toBeDefined();
    expect(policy.rules['DB_URL'].required).toBe(true);
  });

  it('enforces policy against real entries', () => {
    savePolicy({
      version: 1,
      rules: {
        'PORT': { pattern: 'PORT', regex: '^[0-9]+$', noEmpty: true },
      },
    });
    const policy = loadPolicy();

    const valid = enforcePolicy({ PORT: '3000' }, policy);
    expect(valid.length).toBe(0);

    const invalid = enforcePolicy({ PORT: 'abc' }, policy);
    expect(invalid.length).toBeGreaterThan(0);
  });

  it('returns no violations for empty policy', () => {
    savePolicy({ version: 1, rules: {} });
    const policy = loadPolicy();
    const violations = enforcePolicy({ ANYTHING: 'value' }, policy);
    expect(violations.length).toBe(0);
  });
});
