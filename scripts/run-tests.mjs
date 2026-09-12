import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDirectory, '..');
const testsDirectory = path.join(projectRoot, 'tests');
const testFiles = readdirSync(testsDirectory)
  .filter((fileName) => fileName.endsWith('.test.ts'))
  .sort()
  .map((fileName) => path.join('tests', fileName));
const tsxCli = path.join(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const preload = './scripts/test-preload.cjs';
const nodeOptions = [process.env.NODE_OPTIONS, `--require=${preload}`]
  .filter(Boolean)
  .join(' ');

const result = spawnSync(process.execPath, [tsxCli, '--test', ...testFiles], {
  cwd: projectRoot,
  env: { ...process.env, NODE_OPTIONS: nodeOptions },
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exit(typeof result.status === 'number' ? result.status : 1);
