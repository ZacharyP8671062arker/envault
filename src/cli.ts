#!/usr/bin/env node
import { Command } from "commander";
import { runInit } from "./commands/init";
import { runPull } from "./commands/pull";

const program = new Command();

program
  .name("envault")
  .description("Encrypt and sync .env files across team members using asymmetric keys")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize envault: generate a key pair for this user")
  .action(async () => {
    await runInit();
  });

program
  .command("pull")
  .description("Decrypt vault and write variables to a local .env file")
  .option("-o, --output <file>", "Output file path", ".env")
  .action(async (options: { output: string }) => {
    await runPull(options.output);
  });

program
  .command("push")
  .description("Encrypt local .env file and save to vault")
  .option("-i, --input <file>", "Input .env file path", ".env")
  .action(async () => {
    const { runPush } = await import("./commands/push");
    await runPush();
  });

program
  .command("add")
  .description("Add or update a single variable in the vault")
  .argument("<key>", "Variable name")
  .argument("<value>", "Variable value")
  .action(async (key: string, value: string) => {
    const { runAdd } = await import("./commands/add");
    await runAdd(key, value);
  });

program
  .command("sync")
  .description("Sync vault with remote team members")
  .action(async () => {
    const { runSync } = await import("./commands/sync");
    await runSync();
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
