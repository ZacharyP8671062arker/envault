import * as fs from "fs";
import * as path from "path";
import { loadVault, saveVault } from "./add";
import { loadPublicKey } from "../crypto/keyPair";
import { logAction } from "../crypto/auditLogger";

export interface CloneOptions {
  sourceVault: string;
  targetVault: string;
  userId?: string;
}

export async function cloneVault(options: CloneOptions): Promise<void> {
  const { sourceVault, targetVault, userId } = options;

  if (!fs.existsSync(sourceVault)) {
    throw new Error(`Source vault not found: ${sourceVault}`);
  }

  if (fs.existsSync(targetVault)) {
    throw new Error(`Target vault already exists: ${targetVault}`);
  }

  const vault = loadVault(sourceVault);

  const clonedVault = JSON.parse(JSON.stringify(vault));

  if (userId) {
    const publicKeyPath = path.join(".envault", "keys", `${userId}.pub`);
    const publicKey = loadPublicKey(publicKeyPath);
    if (!publicKey) {
      throw new Error(`Public key not found for user: ${userId}`);
    }
    clonedVault.sharedWith = clonedVault.sharedWith || [];
    if (!clonedVault.sharedWith.includes(userId)) {
      clonedVault.sharedWith.push(userId);
    }
  }

  const targetDir = path.dirname(targetVault);
  if (targetDir && !fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  saveVault(targetVault, clonedVault);

  await logAction("clone", {
    source: sourceVault,
    target: targetVault,
    userId: userId ?? "self",
  });

  console.log(`Vault cloned from "${sourceVault}" to "${targetVault}".`);
}

export async function runClone(args: string[]): Promise<void> {
  const [sourceVault, targetVault, userId] = args;

  if (!sourceVault || !targetVault) {
    console.error("Usage: envault clone <sourceVault> <targetVault> [userId]");
    process.exit(1);
  }

  try {
    await cloneVault({ sourceVault, targetVault, userId });
  } catch (err: any) {
    console.error(`Clone failed: ${err.message}`);
    process.exit(1);
  }
}
