import * as fs from 'fs';
import * as path from 'path';

export interface LintIssue {
  line: number;
  key: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface LintResult {
  file: string;
  issues: LintIssue[];
  valid: boolean;
}

const KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const DUPLICATE_WHITESPACE = /=\s+/;
const QUOTED_WITH_SPACES = /^".*"$|^'.*'$/;

export function lintEnvContent(content: string, filePath: string): LintResult {
  const issues: LintIssue[] = [];
  const lines = content.split('\n');
  const seenKeys = new Set<string>();

  lines.forEach((raw, idx) => {
    const lineNum = idx + 1;
    const line = raw.trim();

    if (!line || line.startsWith('#')) return;

    if (!line.includes('=')) {
      issues.push({ line: lineNum, key: line, message: 'Missing "=" separator', severity: 'error' });
      return;
    }

    const eqIdx = line.indexOf('=');
    const key = line.substring(0, eqIdx).trim();
    const value = line.substring(eqIdx + 1);

    if (!KEY_PATTERN.test(key)) {
      issues.push({ line: lineNum, key, message: `Key "${key}" should be uppercase with underscores only`, severity: 'warning' });
    }

    if (seenKeys.has(key)) {
      issues.push({ line: lineNum, key, message: `Duplicate key "${key}"`, severity: 'error' });
    }
    seenKeys.add(key);

    if (DUPLICATE_WHITESPACE.test(line)) {
      issues.push({ line: lineNum, key, message: 'Whitespace after "=" sign', severity: 'warning' });
    }

    const trimmedVal = value.trim();
    if (trimmedVal.includes(' ') && !QUOTED_WITH_SPACES.test(trimmedVal)) {
      issues.push({ line: lineNum, key, message: 'Value with spaces should be quoted', severity: 'warning' });
    }
  });

  return {
    file: filePath,
    issues,
    valid: issues.filter(i => i.severity === 'error').length === 0,
  };
}

export function runLint(filePath: string = '.env'): void {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  const content = fs.readFileSync(resolved, 'utf-8');
  const result = lintEnvContent(content, filePath);

  if (result.issues.length === 0) {
    console.log(`✔  No issues found in ${filePath}`);
    return;
  }

  result.issues.forEach(issue => {
    const icon = issue.severity === 'error' ? '✖' : '⚠';
    console.log(`${icon}  [${issue.severity.toUpperCase()}] Line ${issue.line} (${issue.key}): ${issue.message}`);
  });

  const errors = result.issues.filter(i => i.severity === 'error').length;
  const warnings = result.issues.filter(i => i.severity === 'warning').length;
  console.log(`\n${errors} error(s), ${warnings} warning(s) in ${filePath}`);

  if (!result.valid) process.exit(1);
}
