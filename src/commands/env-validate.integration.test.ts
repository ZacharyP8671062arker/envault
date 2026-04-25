import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseEnvFileToMap, validateEnvAgainstSchema } from './env-validate';
import { saveSchema } from './schema';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-validate-int-'));
}

describe('env-validate integration', () => {
  it('validates a full .env file against schema end-to-end', () => {
    const dir = makeTempDir();
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, [
      'DB_URL=postgres://localhost/mydb',
      'PORT=5432',
      'DEBUG=true',
      'API_KEY=abc123',
    ].join('\n'));

    saveSchema(dir, {
      DB_URL: { required: true, type: 'string' },
      PORT: { required: true, type: 'number' },
      DEBUG: { required: false, type: 'boolean' },
      API_KEY: { required: true, type: 'string', pattern: '^[a-z0-9]+$' },
    });

    const envMap = parseEnvFileToMap(envFile);
    const results = validateEnvAgainstSchema(envMap, dir);
    expect(results.every(r => r.valid)).toBe(true);
  });

  it('reports multiple failures in one pass', () => {
    const dir = makeTempDir();
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'PORT=notanumber\nDEBUG=maybe\n');

    saveSchema(dir, {
      PORT: { required: true, type: 'number' },
      DEBUG: { required: true, type: 'boolean' },
      SECRET: { required: true, type: 'string' },
    });

    const envMap = parseEnvFileToMap(envFile);
    const results = validateEnvAgainstSchema(envMap, dir);
    const failures = results.filter(r => !r.valid);
    expect(failures.length).toBeGreaterThanOrEqual(3);
  });
});
