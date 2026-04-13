import { logAction, logPush, logPull, logShare, logUnshare, logRotate, logExport } from './auditLogger';
import * as audit from '../commands/audit';

jest.mock('../commands/audit');

const mockAppend = audit.appendAuditEntry as jest.MockedFunction<typeof audit.appendAuditEntry>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-06-01T10:00:00.000Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('logAction', () => {
  it('appends a correctly structured entry', () => {
    logAction('push', 'alice', 'DB_PASSWORD', 'some detail');
    expect(mockAppend).toHaveBeenCalledWith({
      timestamp: '2024-06-01T10:00:00.000Z',
      action: 'push',
      user: 'alice',
      target: 'DB_PASSWORD',
      details: 'some detail',
    });
  });

  it('omits target and details when not provided', () => {
    logAction('init', 'bob');
    expect(mockAppend).toHaveBeenCalledWith({
      timestamp: '2024-06-01T10:00:00.000Z',
      action: 'init',
      user: 'bob',
    });
  });
});

describe('helper loggers', () => {
  it('logPush calls appendAuditEntry with push action', () => {
    logPush('alice', 'API_KEY');
    expect(mockAppend).toHaveBeenCalledWith(expect.objectContaining({ action: 'push', user: 'alice', target: 'API_KEY' }));
  });

  it('logPull calls appendAuditEntry with pull action', () => {
    logPull('bob', 'SECRET');
    expect(mockAppend).toHaveBeenCalledWith(expect.objectContaining({ action: 'pull', user: 'bob', target: 'SECRET' }));
  });

  it('logShare calls appendAuditEntry with share action', () => {
    logShare('alice', 'charlie');
    expect(mockAppend).toHaveBeenCalledWith(expect.objectContaining({ action: 'share', user: 'alice', target: 'charlie' }));
  });

  it('logUnshare calls appendAuditEntry with unshare action', () => {
    logUnshare('alice', 'charlie');
    expect(mockAppend).toHaveBeenCalledWith(expect.objectContaining({ action: 'unshare', user: 'alice', target: 'charlie' }));
  });

  it('logRotate calls appendAuditEntry with rotate action', () => {
    logRotate('alice');
    expect(mockAppend).toHaveBeenCalledWith(expect.objectContaining({ action: 'rotate', user: 'alice' }));
  });

  it('logExport calls appendAuditEntry with export action', () => {
    logExport('alice', '.env.production');
    expect(mockAppend).toHaveBeenCalledWith(expect.objectContaining({ action: 'export', user: 'alice', target: '.env.production' }));
  });
});
