import { Command } from 'commander';
import { runEnvCopy } from './env-copy';

export function registerEnvCopyCommand(program: Command): void {
  program
    .command('env-copy <source-vault> <dest-vault> [keys...]')
    .description('Copy encrypted keys from one vault to another')
    .option('--overwrite', 'Overwrite existing keys in the destination vault', false)
    .option('--dry-run', 'Preview changes without writing to disk', false)
    .action(async (sourceVault: string, destVault: string, keys: string[], opts) => {
      try {
        await runEnvCopy(sourceVault, destVault, keys, {
          overwrite: opts.overwrite,
          dryRun: opts.dryRun,
        });
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
