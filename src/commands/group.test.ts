import * as fs from 'fs';
import { loadGroups, saveGroups, createGroup, deleteGroup, addKeyToGroup, removeKeyFromGroup, getKeysInGroup, listGroups } from './group';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

beforeEach(() => {
  jest.clearAllMocks();
  mockedFs.existsSync.mockReturnValue(false);
});

test('loadGroups returns empty object when file does not exist', () => {
  mockedFs.existsSync.mockReturnValue(false);
  expect(loadGroups()).toEqual({});
});

test('loadGroups parses existing file', () => {
  mockedFs.existsSync.mockReturnValue(true);
  mockedFs.readFileSync.mockReturnValue(JSON.stringify({ myGroup: ['KEY_A'] }));
  expect(loadGroups()).toEqual({ myGroup: ['KEY_A'] });
});

test('saveGroups writes JSON to file', () => {
  mockedFs.existsSync.mockReturnValue(true);
  const groups = { prod: ['DB_URL'] };
  saveGroups(groups);
  expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
    '.envault/groups.json',
    JSON.stringify(groups, null, 2),
    'utf-8'
  );
});

test('createGroup adds a new group', () => {
  mockedFs.existsSync.mockReturnValue(true);
  mockedFs.readFileSync.mockReturnValue('{}');
  createGroup('staging');
  expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
    '.envault/groups.json',
    JSON.stringify({ staging: [] }, null, 2),
    'utf-8'
  );
});

test('createGroup throws if group already exists', () => {
  mockedFs.existsSync.mockReturnValue(true);
  mockedFs.readFileSync.mockReturnValue(JSON.stringify({ staging: [] }));
  expect(() => createGroup('staging')).toThrow('Group "staging" already exists.');
});

test('deleteGroup removes existing group', () => {
  mockedFs.existsSync.mockReturnValue(true);
  mockedFs.readFileSync.mockReturnValue(JSON.stringify({ staging: ['KEY_A'] }));
  deleteGroup('staging');
  expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
    '.envault/groups.json',
    JSON.stringify({}, null, 2),
    'utf-8'
  );
});

test('deleteGroup throws if group does not exist', () => {
  mockedFs.existsSync.mockReturnValue(true);
  mockedFs.readFileSync.mockReturnValue('{}');
  expect(() => deleteGroup('ghost')).toThrow('Group "ghost" does not exist.');
});

test('addKeyToGroup adds key to group', () => {
  mockedFs.existsSync.mockReturnValue(true);
  mockedFs.readFileSync.mockReturnValue(JSON.stringify({ prod: [] }));
  addKeyToGroup('prod', 'API_KEY');
  expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
    '.envault/groups.json',
    JSON.stringify({ prod: ['API_KEY'] }, null, 2),
    'utf-8'
  );
});

test('removeKeyFromGroup removes key from group', () => {
  mockedFs.existsSync.mockReturnValue(true);
  mockedFs.readFileSync.mockReturnValue(JSON.stringify({ prod: ['API_KEY', 'DB_URL'] }));
  removeKeyFromGroup('prod', 'API_KEY');
  expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
    '.envault/groups.json',
    JSON.stringify({ prod: ['DB_URL'] }, null, 2),
    'utf-8'
  );
});

test('getKeysInGroup returns keys for group', () => {
  mockedFs.existsSync.mockReturnValue(true);
  mockedFs.readFileSync.mockReturnValue(JSON.stringify({ prod: ['API_KEY'] }));
  expect(getKeysInGroup('prod')).toEqual(['API_KEY']);
});

test('listGroups returns all group names', () => {
  mockedFs.existsSync.mockReturnValue(true);
  mockedFs.readFileSync.mockReturnValue(JSON.stringify({ prod: [], staging: [] }));
  expect(listGroups()).toEqual(['prod', 'staging']);
});
