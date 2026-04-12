#!/usr/bin/env node
import { Command } from "commander";
import { runInit } from "./commands/init";
import { runRotate } from "./commands/rotate";
import { parseEnvFile } from "./commands/push";
import fs from "fs";
import path from "path";

const program = new Command();

program
  .name("envault")
  .description("Encrypt and sync .env files using asymmetric keys")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize envault in the current project")
  .action(async () => {
    await runInit();
  });

program
  .command("push")
  .description("Encrypt and push .env file to vault")
  .option("-f, --file <path>", "Path to .env file", ".env")
  .action(async (opts) => {
    const { default: runPush } = await import("./commands/push");
    await (runPush as any)(opts.file);
  });

program
  .command("pull")
  .description("Decrypt vault and write .env file")
  .option("-f, --file <path>", "Output .env file path", ".env")
  .action(async (opts) => {
    const { default: runPull } = await import("./commands/pull");
    await (runPull as any)(opts.file);
  });

program
  .command("add <key> <value>")
  .description("Add or update a single key in the vault")
  .action(async (key, value) => {
    const { default: runAdd } = await import("./commands/add");
    await (runAdd as any)(key, value);
  });

program
  .command("sync")
  .description("Sync vault with remote")
  .action(async () => {
    const { default: runSync } = await import("./commands/sync");
    await (runSync as any)();
  });

program
  .command("rotate")
  .description("Rotate key pair and re-encrypt all vault entries")
  .action(async () => {
    await runRotate();
  });

program.parse(process.argv);
