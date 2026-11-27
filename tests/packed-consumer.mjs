import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));

export function runNode(args, cwd) {
  const { status, stdout, stderr, error } = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
  });
  if (error) throw error;
  assert.equal(status, 0, `${args.join(' ')} failed\n${stdout}${stderr}`);
  return stdout;
}

function npm(args, cwd = project) {
  return runNode([process.env.npm_execpath, ...args], cwd);
}

export function preparePackedConsumer() {
  const temp = mkdtempSync(join(tmpdir(), 'useclickoutside-'));
  const cleanup = () => rmSync(temp, { recursive: true, force: true });

  try {
    const [pack] = JSON.parse(npm(['pack', '--json', '--foreground-scripts=false', '--pack-destination', temp]));
    const directory = join(temp, 'consumer');
    mkdirSync(directory);
    writeFileSync(join(directory, 'package.json'), JSON.stringify({ private: true }));
    npm(['install', '--offline', '--ignore-scripts', '--no-package-lock', '--no-audit', '--no-fund',
      join(temp, pack.filename), join(project, 'node_modules/vue')], directory);
    return { directory, files: pack.files, cleanup };
  } catch (error) {
    cleanup();
    throw error;
  }
}
