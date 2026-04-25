import type { Command } from 'commander';
import * as path from 'path';
import { runEnvValidate } from './env-validate';

export function registerEnvValidateCommand(program: Command): void {
  program
    .command('env-validate <envFile>')
    .description('Validate a .env file against the vault schema')
    .option('-d, --dir <dir>', 'Vault directory', process.cwd())
    .action((envFile: string, options: { dir: string }) => {
      const resolvedEnv = path.resolve(options.dir, envFile);
      runEnvValidate(resolvedEnv, options.dir);
    });
}
