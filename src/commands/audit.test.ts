import * as fs from 'fs';
import * as path from 'path';
import {
  appendAuditEntry,
  readAuditLog,
  clearAuditLog,
  runAudit,
  AuditEntry,
} from './audit';

jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

const AUDIT_LOG_PATH = path.join(process.cwd(), '.envault', 'audit.log');

const sampleEntry: AuditEntry = {
  timestamp: '2024-01-01T00:00:00.000Z',
  action: 'push',
  user: 'alice',
  target: 'API_KEY',
  details: 'encrypted with public key',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('appendAuditEntry', () => {
  it('creates directory if missing and appends entry', () => {
    mockFs.existsSync.mockReturnValue(false);
    appendAuditEntry(sampleEntry);
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(path.dirname(AUDIT_LOG_PATH), { recursive: true });
    expect(mockFs.appendFileSync).toHaveBeenCalledWith(
      AUDIT_LOG_PATH,
      JSON.stringify(sampleEntry) + '\n',
      'utf-8'
    );
  });

  it('appends entry without creating dir if dir exists', () => {
    mockFs.existsSync.mockReturnValue(true);
    appendAuditEntry(sampleEntry);
    expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    expect(mockFs.appendFileSync).toHaveBeenCalled();
  });
});

describe('readAuditLog', () => {
  it('returns empty array if log does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(readAuditLog()).toEqual([]);
  });

  it('parses log entries correctly', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(sampleEntry) + '\n');
    const entries = readAuditLog();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual(sampleEntry);
  });
});

describe('clearAuditLog', () => {
  it('writes empty string to log if it exists', () => {
    mockFs.existsSync.mockReturnValue(true);
    clearAuditLog();
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(AUDIT_LOG_PATH, '', 'utf-8');
  });

  it('does nothing if log does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    clearAuditLog();
    expect(mockFs.writeFileSync).not.toHaveBeenCalled();
  });
});

describe('runAudit', () => {
  it('prints message when no entries found', () => {
    mockFs.existsSync.mockReturnValue(false);
    const spy = jest.spyOn(console, 'log').mockImplementation();
    runAudit({});
    expect(spy).toHaveBeenCalledWith('No audit entries found.');
    spy.mockRestore();
  });
});
