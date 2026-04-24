import { lintEnvContent, LintResult } from './lint';

describe('lintEnvContent', () => {
  it('returns no issues for a clean .env file', () => {
    const content = 'API_KEY=abc123\nDB_HOST=localhost\nPORT=3000';
    const result: LintResult = lintEnvContent(content, '.env');
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('ignores blank lines and comments', () => {
    const content = '# comment\n\nAPI_KEY=value';
    const result = lintEnvContent(content, '.env');
    expect(result.issues).toHaveLength(0);
  });

  it('flags lines missing an equals sign as error', () => {
    const content = 'INVALID_LINE\nAPI_KEY=ok';
    const result = lintEnvContent(content, '.env');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].severity).toBe('error');
    expect(result.issues[0].message).toMatch(/Missing/);
    expect(result.valid).toBe(false);
  });

  it('warns on lowercase key names', () => {
    const content = 'api_key=value';
    const result = lintEnvContent(content, '.env');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].severity).toBe('warning');
    expect(result.issues[0].message).toMatch(/uppercase/);
  });

  it('flags duplicate keys as errors', () => {
    const content = 'API_KEY=first\nAPI_KEY=second';
    const result = lintEnvContent(content, '.env');
    const dupeIssues = result.issues.filter(i => i.message.includes('Duplicate'));
    expect(dupeIssues).toHaveLength(1);
    expect(dupeIssues[0].severity).toBe('error');
    expect(result.valid).toBe(false);
  });

  it('warns on whitespace after equals sign', () => {
    const content = 'API_KEY= value';
    const result = lintEnvContent(content, '.env');
    const wsIssues = result.issues.filter(i => i.message.includes('Whitespace'));
    expect(wsIssues).toHaveLength(1);
    expect(wsIssues[0].severity).toBe('warning');
  });

  it('warns on unquoted value containing spaces', () => {
    const content = 'MY_VALUE=hello world';
    const result = lintEnvContent(content, '.env');
    const spaceIssues = result.issues.filter(i => i.message.includes('quoted'));
    expect(spaceIssues).toHaveLength(1);
  });

  it('does not warn on quoted value containing spaces', () => {
    const content = 'MY_VALUE="hello world"';
    const result = lintEnvContent(content, '.env');
    const spaceIssues = result.issues.filter(i => i.message.includes('quoted'));
    expect(spaceIssues).toHaveLength(0);
  });

  it('accumulates multiple issues across lines', () => {
    const content = 'bad_key= unquoted spaces\nBAD_KEY= unquoted spaces';
    const result = lintEnvContent(content, '.env');
    expect(result.issues.length).toBeGreaterThanOrEqual(4);
  });
});
