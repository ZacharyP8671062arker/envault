import { loadPolicy, enforcePolicy, PolicyViolation } from './policy';
import { loadVault } from './add';
import { loadPrivateKey } from '../crypto/keyPair';
import { decryptWithPrivateKey } from '../crypto/encrypt';

export async function runPolicyCheck(args: string[]): Promise<void> {
  const verbose = args.includes('--verbose');
  const policy = loadPolicy();
  const ruleCount = Object.keys(policy.rules).length;

  if (ruleCount === 0) {
    console.log('No policy rules defined. Run `envault policy set` to add rules.');
    return;
  }

  let privateKey: string;
  try {
    privateKey = loadPrivateKey();
  } catch {
    console.error('Could not load private key. Run `envault unlock` first.');
    process.exit(1);
  }

  const vault = loadVault();
  const decrypted: Record<string, string> = {};

  for (const [key, encryptedValue] of Object.entries(vault)) {
    try {
      decrypted[key] = await decryptWithPrivateKey(encryptedValue, privateKey);
    } catch {
      if (verbose) console.warn(`  Warning: could not decrypt '${key}', skipping.`);
    }
  }

  const violations: PolicyViolation[] = enforcePolicy(decrypted, policy);

  if (violations.length === 0) {
    console.log(`✔ All ${ruleCount} policy rule(s) passed.`);
    return;
  }

  console.error(`✖ ${violations.length} policy violation(s) found:\n`);
  for (const v of violations) {
    console.error(`  [${v.key}] ${v.message}`);
  }

  if (!args.includes('--no-exit')) {
    process.exit(1);
  }
}
