import { execSync } from 'node:child_process';
import fs from 'node:fs';

console.log('Running Vercel build for @codemapai/web...');
execSync('pnpm --filter @codemapai/web build', { stdio: 'inherit' });

if (fs.existsSync('apps/web/dist')) {
  fs.cpSync('apps/web/dist', 'dist', { recursive: true });
}
if (fs.existsSync('dist') && !fs.existsSync('apps/web/dist')) {
  fs.mkdirSync('apps/web', { recursive: true });
  fs.cpSync('dist', 'apps/web/dist', { recursive: true });
}

console.log('Vercel build output sync completed successfully.');
