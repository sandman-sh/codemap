import { rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const lockfilesToRemove = ["package-lock.json", "yarn.lock"];

await Promise.all(
  lockfilesToRemove.map(async (file) => {
    try {
      await rm(path.join(root, file), { force: true });
    } catch {
      // Ignore cleanup failures for non-existent lockfiles.
    }
  }),
);

const userAgent = process.env.npm_config_user_agent ?? "";

if (!userAgent.startsWith("pnpm/")) {
  console.error("This repository uses pnpm. Run `pnpm install` instead.");
  process.exit(1);
}
