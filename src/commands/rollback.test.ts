import { rollbackToSnapshot } from './rollback';
import * as snapshotModule from './snapshot';
import * as addModule from './add';
import * as auditLogger from '../crypto/auditLogger';

jest.mock('./snapshot');
jest.mock('./add');
jest.mock('../crypto/auditLogger');

const mockVaultPath = '/mock/vault';

const mockSnapshots = [
  { id: 'snap-001', createdAt: '2024-01-01T00:00:00Z', label: 'initial' },
  { id: 'snap-002', createdAt: '2024-01-02T00:00:00Z', label: 'after-push' },
];

const mockVaultData = {
  API_KEY: 'encrypted-api-key',
  DB_URL: 'encrypted-db-url',
};

beforeEach(() => {
  jest.clearAllMocks();
  (snapshotModule.listSnapshots as jest.Mock).mockResolvedValue(mockSnapshots);
  (snapshotModule.loadSnapshot as jest.Mock).mockResolvedValue({ vault: mockVaultData });
  (addModule.saveVault as jest.Mock).mockResolvedValue(undefined);
  (auditLogger.logAction as jest.Mock).mockResolvedValue(undefined);
});

describe('rollbackToSnapshot', () => {
  it('should successfully rollback to an existing snapshot by full ID', async () => {
    const result = await rollbackToSnapshot(mockVaultPath, 'snap-001');
    expect(result.success).toBe(true);
    expect(result.snapshotId).toBe('snap-001');
    expect(result.keysRestored).toBe(2);
    expect(addModule.saveVault).toHaveBeenCalledWith(mockVaultPath, mockVaultData);
  });

  it('should match snapshot by partial prefix', async () => {
    const result = await rollbackToSnapshot(mockVaultPath, 'snap-002');
    expect(result.success).toBe(true);
    expect(result.snapshotId).toBe('snap-002');
  });

  it('should return failure if snapshot ID is not found', async () => {
    const result = await rollbackToSnapshot(mockVaultPath, 'snap-999');
    expect(result.success).toBe(false);
    expect(result.message).toContain('snap-999');
    expect(addModule.saveVault).not.toHaveBeenCalled();
  });

  it('should return failure if snapshot data is null', async () => {
    (snapshotModule.loadSnapshot as jest.Mock).mockResolvedValue(null);
    const result = await rollbackToSnapshot(mockVaultPath, 'snap-001');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to load snapshot data');
  });

  it('should log the rollback action on success', async () => {
    await rollbackToSnapshot(mockVaultPath, 'snap-001');
    expect(auditLogger.logAction).toHaveBeenCalledWith('rollback', expect.objectContaining({
      snapshotId: 'snap-001',
      keysRestored: 2,
    }));
  });

  it('should not log action on failure', async () => {
    const result = await rollbackToSnapshot(mockVaultPath, 'nonexistent');
    expect(result.success).toBe(false);
    expect(auditLogger.logAction).not.toHaveBeenCalled();
  });
});
