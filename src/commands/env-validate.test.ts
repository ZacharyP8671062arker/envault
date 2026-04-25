import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseEnvFileToMap, validateEnvAgainstSchema } from './env-validate';
import { saveSchema } from './schema';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-validate-'));
}

describe('parseEnvFileToMap', () => {
  it('parses a basic env file', () => {
    const dir = makeTempDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'FOO=bar\nBAZ=123\n');
    const result = parseEnvFileToMap(file);
    expect(result['FOO']).toBe('bar');
    expect(result['BAZ']).toBe('123');
  });

  it('ignores comments and blank lines', () => {
    const dir = makeTempDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, '# comment\n\nKEY=value\n');
    const result = parseEnvFileToMap(file);
    expect(Object.keys(result)).toEqual(['KEY']);
  });

  it('strips surrounding quotes from values', () => {
    const dir = makeTempDir();
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, 'SECRET="mysecret"\n');
    const result = parseEnvFileToMap(file);
    expect(result['SECRET']).toBe('mysecret');
  });

  it('throws if file does not exist', () => {
    expect(() => parseEnvFileToMap('/nonexistent/.env')).toThrow('File not found');
  });
});

describe('validateEnvAgainstSchema', () => {
  it('passes when required keys are present', () => {
    const dir = makeTempDir();
    saveSchema(dir, { DB_URL: { required: true, type: 'string' } });
    const results = validateEnvAgainstSchema({ DB_URL: 'postgres://localhost' }, dir);
    expect(results[0].valid).toBe(true);
  });

  it('fails when required key is missing', () => {
    const dir = makeTempDir();
    saveSchema(dir, { API_KEY: { required: true, type: 'string' } });
    const results = validateEnvAgainstSchema({}, dir);
    expect(results[0].valid).toBe(false);
    expect(results[0].reason).toMatch(/Required/);
  });

  it('fails on pattern mismatch', () => {
    const dir = makeTempDir();
    saveSchema(dir, { PORT: { required: false, type: 'string', pattern: '^\\d+$' } });
    const results = validateEnvAgainstSchema({ PORT: 'abc' }, dir);
    expect(results[0].valid).toBe(false);
    expect(results[0].reason).toMatch(/pattern/);
  });

  it('fails on non-numeric value for number type', () => {
    const dir = makeTempDir();
    saveSchema(dir, { TIMEOUT: { required: false, type: 'number' } });
    const results = validateEnvAgainstSchema({ TIMEOUT: 'notanumber' }, dir);
    expect(results[0].valid).toBe(false);
    expect(results[0].reason).toMatch(/numeric/);
  });

  it('fails on invalid boolean', () => {
    const dir = makeTempDir();
    saveSchema(dir, { DEBUG: { required: false, type: 'boolean' } });
    const results = validateEnvAgainstSchema({ DEBUG: 'yes' }, dir);
    expect(results[0].valid).toBe(false);
    expect(results[0].reason).toMatch(/boolean/);
  });

  it('returns empty array when schema is empty', () => {
    const dir = makeTempDir();
    saveSchema(dir, {});
    const results = validateEnvAgainstSchema({ FOO: 'bar' }, dir);
    expect(results).toHaveLength(0);
  });
});
