import * as fs from 'fs';
import * as path from 'path';

export interface PolicyRule {
  pattern: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  noEmpty?: boolean;
  regex?: string;
  description?: string;
}

export interface Policy {
  version: number;
  rules: Record<string, PolicyRule>;
}

const POLICY_FILE = '.envault/policy.json';

export function loadPolicy(): Policy {
  if (!fs.existsSync(POLICY_FILE)) {
    return { version: 1, rules: {} };
  }
  const raw = fs.readFileSync(POLICY_FILE, 'utf-8');
  return JSON.parse(raw) as Policy;
}

export function savePolicy(policy: Policy): void {
  const dir = path.dirname(POLICY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(POLICY_FILE, JSON.stringify(policy, null, 2), 'utf-8');
}

export function setPolicyRule(key: string, rule: PolicyRule): void {
  const policy = loadPolicy();
  policy.rules[key] = rule;
  savePolicy(policy);
}

export function removePolicyRule(key: string): boolean {
  const policy = loadPolicy();
  if (!policy.rules[key]) return false;
  delete policy.rules[key];
  savePolicy(policy);
  return true;
}

export interface PolicyViolation {
  key: string;
  value: string;
  message: string;
}

export function enforcePolicy(
  entries: Record<string, string>,
  policy: Policy
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];

  for (const [pattern, rule] of Object.entries(policy.rules)) {
    const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);
    const matchedKeys = Object.keys(entries).filter(k => regex.test(k));

    if (rule.required && matchedKeys.length === 0) {
      violations.push({ key: pattern, value: '', message: `Required key matching '${pattern}' is missing` });
      continue;
    }

    for (const key of matchedKeys) {
      const value = entries[key];

      if (rule.noEmpty && value.trim() === '') {
        violations.push({ key, value, message: `Key '${key}' must not be empty` });
      }
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        violations.push({ key, value, message: `Key '${key}' value too short (min ${rule.minLength})` });
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        violations.push({ key, value, message: `Key '${key}' value too long (max ${rule.maxLength})` });
      }
      if (rule.regex) {
        const valRegex = new RegExp(rule.regex);
        if (!valRegex.test(value)) {
          violations.push({ key, value, message: `Key '${key}' does not match pattern /${rule.regex}/` });
        }
      }
    }
  }

  return violations;
}

export function runPolicy(args: string[]): void {
  const [sub, key, ...rest] = args;

  if (sub === 'list') {
    const policy = loadPolicy();
    const rules = Object.entries(policy.rules);
    if (rules.length === 0) {
      console.log('No policy rules defined.');
      return;
    }
    for (const [k, r] of rules) {
      console.log(`${k}: ${JSON.stringify(r)}`);
    }
    return;
  }

  if (sub === 'set' && key) {
    const rule: PolicyRule = { pattern: key };
    for (const flag of rest) {
      if (flag.startsWith('--min=')) rule.minLength = parseInt(flag.split('=')[1]);
      if (flag.startsWith('--max=')) rule.maxLength = parseInt(flag.split('=')[1]);
      if (flag === '--required') rule.required = true;
      if (flag === '--no-empty') rule.noEmpty = true;
      if (flag.startsWith('--regex=')) rule.regex = flag.split('=')[1];
    }
    setPolicyRule(key, rule);
    console.log(`Policy rule set for '${key}'.`);
    return;
  }

  if (sub === 'remove' && key) {
    const removed = removePolicyRule(key);
    console.log(removed ? `Policy rule for '${key}' removed.` : `No rule found for '${key}'.`);
    return;
  }

  console.error('Usage: envault policy <list|set|remove> [key] [options]');
  process.exit(1);
}
