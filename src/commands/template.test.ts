import * as fs from 'fs';
import {
  loadTemplates,
  saveTemplates,
  createTemplate,
  deleteTemplate,
  applyTemplate,
  Template,
} from './template';

jest.mock('fs');
jest.mock('./add', () => ({
  loadVault: jest.fn(() => ({ DB_HOST: 'enc_abc', API_KEY: 'enc_xyz', SECRET: 'enc_123' })),
}));

const mockFs = fs as jest.Mocked<typeof fs>;

beforeEach(() => {
  jest.clearAllMocks();
  mockFs.existsSync.mockReturnValue(false);
  mockFs.readFileSync.mockReturnValue('{}');
  mockFs.writeFileSync.mockImplementation(() => {});
  mockFs.mkdirSync.mockImplementation(() => undefined);
});

describe('loadTemplates', () => {
  it('returns empty object when file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(loadTemplates()).toEqual({});
  });

  it('parses templates from file', () => {
    const data = { mytemplate: { name: 'mytemplate', keys: ['DB_HOST'], createdAt: '2024-01-01' } };
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(data));
    expect(loadTemplates()).toEqual(data);
  });
});

describe('createTemplate', () => {
  it('creates a new template and saves it', () => {
    mockFs.existsSync.mockReturnValue(false);
    const template = createTemplate('backend', ['DB_HOST', 'API_KEY']);
    expect(template.name).toBe('backend');
    expect(template.keys).toEqual(['DB_HOST', 'API_KEY']);
    expect(template.createdAt).toBeDefined();
    expect(mockFs.writeFileSync).toHaveBeenCalled();
  });

  it('throws if template already exists', () => {
    const existing = { backend: { name: 'backend', keys: ['DB_HOST'], createdAt: '2024-01-01' } };
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(existing));
    expect(() => createTemplate('backend', ['API_KEY'])).toThrow('already exists');
  });
});

describe('deleteTemplate', () => {
  it('deletes an existing template', () => {
    const existing = { mytemplate: { name: 'mytemplate', keys: ['DB_HOST'], createdAt: '2024-01-01' } };
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(existing));
    expect(() => deleteTemplate('mytemplate')).not.toThrow();
    expect(mockFs.writeFileSync).toHaveBeenCalled();
  });

  it('throws if template does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(() => deleteTemplate('ghost')).toThrow('not found');
  });
});

describe('applyTemplate', () => {
  it('returns keys from template and warns about missing vault keys', () => {
    const existing: Record<string, Template> = {
      backend: { name: 'backend', keys: ['DB_HOST', 'MISSING_KEY'], createdAt: '2024-01-01' },
    };
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(existing));
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const keys = applyTemplate('backend');
    expect(keys).toEqual(['DB_HOST', 'MISSING_KEY']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('MISSING_KEY'));
    consoleSpy.mockRestore();
  });

  it('throws if template does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(() => applyTemplate('nonexistent')).toThrow('not found');
  });
});
