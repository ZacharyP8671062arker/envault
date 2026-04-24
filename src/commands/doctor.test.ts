import * as fs from 'fs';
import * as path from 'path';
import { runDoctorChecks, formatDoctorOutput, DoctorCheck } from './doctor';
import * as keyPair from '../crypto/keyPair';

jest.mock('fs');
jest.mock('../crypto/keyPair');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedKeyPair = keyPair as jest.Mocked<typeof keyPair>;

describe('runDoctorChecks', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns error if .envault directory is missing', async () => {
    mockedFs.existsSync.mockReturnValue(false);
    const checks = await runDoctorChecks();
    expect(checks).toHaveLength(1);
    expect(checks[0].name).toBe('envault directory');
    expect(checks[0].status).toBe('error');
  });

  it('returns ok for all checks when setup is complete', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('.envault/keys\n.env\n' as any);
    (mockedKeyPair.loadPublicKey as jest.Mock).mockResolvedValue('pubkey');
    (mockedKeyPair.loadPrivateKey as jest.Mock).mockResolvedValue('privkey');

    const checks = await runDoctorChecks();
    const statuses = checks.map(c => c.status);
    expect(statuses.every(s => s === 'ok')).toBe(true);
  });

  it('warns when vault.json is missing', async () => {
    mockedFs.existsSync.mockImplementation((p: fs.PathLike) => {
      const str = p.toString();
      if (str.endsWith('.envault')) return true;
      if (str.endsWith('vault.json')) return false;
      return true;
    });
    mockedFs.readFileSync.mockReturnValue('.envault/keys\n' as any);
    (mockedKeyPair.loadPublicKey as jest.Mock).mockResolvedValue('pubkey');
    (mockedKeyPair.loadPrivateKey as jest.Mock).mockResolvedValue('privkey');

    const checks = await runDoctorChecks();
    const vaultCheck = checks.find(c => c.name === 'vault file');
    expect(vaultCheck?.status).toBe('warn');
  });

  it('warns when private key cannot be loaded', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('.envault/keys\n' as any);
    (mockedKeyPair.loadPublicKey as jest.Mock).mockResolvedValue('pubkey');
    (mockedKeyPair.loadPrivateKey as jest.Mock).mockRejectedValue(new Error('locked'));

    const checks = await runDoctorChecks();
    const pkCheck = checks.find(c => c.name === 'private key');
    expect(pkCheck?.status).toBe('warn');
  });
});

describe('formatDoctorOutput', () => {
  it('includes summary for all ok', () => {
    const checks: DoctorCheck[] = [
      { name: 'test', status: 'ok', message: 'all good' }
    ];
    const output = formatDoctorOutput(checks);
    expect(output).toContain('All checks passed');
    expect(output).toContain('✔');
  });

  it('includes error summary when errors present', () => {
    const checks: DoctorCheck[] = [
      { name: 'test', status: 'error', message: 'broken' }
    ];
    const output = formatDoctorOutput(checks);
    expect(output).toContain('Issues found');
    expect(output).toContain('✖');
  });

  it('includes warning summary when only warnings present', () => {
    const checks: DoctorCheck[] = [
      { name: 'test', status: 'warn', message: 'watch out' }
    ];
    const output = formatDoctorOutput(checks);
    expect(output).toContain('Warnings detected');
    expect(output).toContain('⚠');
  });
});
