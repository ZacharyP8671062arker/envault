import { Command } from 'commander';
import * as path from 'path';
import { runEnvDiff } from './env-diff';

export function registerEnvDiffCommand(program: Command): void {
  program
    .command('env-diff')
    .description('Compare local .env file against the encrypted vault')
    .option('--env <path>', 'Path to .env file', '.env')
    .option('--vault <path>', 'Path to vault directory', '.envault')
    .option('--all', 'Show unchanged keys as well', false)
    .action(async (options: { env: string; vault: string; all: boolean }) => {
      const envPath = path.resolve(process.cwd(), options.env);
      const vaultPath = path.resolve(process.cwd(), options.vault);
      try {
        await runEnvDiff(envPath, vaultPath, options.all);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
