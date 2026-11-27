import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const npmCli = process.env.npm_execpath;
const tsc = join(project, 'node_modules/typescript/bin/tsc');

function runNode(args, cwd) {
  const { status, stdout, stderr, error } = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
  });
  if (error) throw error;
  assert.equal(status, 0, `${args.join(' ')} failed\n${stdout}${stderr}`);
  return stdout;
}

function npm(args, cwd = project) {
  return runNode([npmCli, ...args], cwd);
}

function typecheck(compilerOptions, file) {
  runNode([tsc, '--noEmit', '--strict', '--skipLibCheck', '--target', 'ES2020',
    ...compilerOptions, file], dirname(file));
}

test('the packed package works in a Vue consumer project', async (t) => {
  const temp = mkdtempSync(join(tmpdir(), 'useclickoutside-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));

  const [pack] = JSON.parse(npm(['pack', '--json', '--foreground-scripts=false', '--pack-destination', temp]));
  await t.test('the tarball contains the library, README, and license', () => {
    assert.deepEqual(pack.files.map(({ path }) => path).sort(), [
      'LICENSE',
      'README.md',
      'dist/types/index.d.cts',
      'dist/types/index.d.ts',
      'dist/use-click-outside.js',
      'dist/use-click-outside.umd.cjs',
      'package.json',
    ]);
  });

  const consumer = join(temp, 'consumer');
  mkdirSync(consumer);
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true }));
  npm(['install', '--offline', '--ignore-scripts', '--no-package-lock', '--no-audit', '--no-fund',
    join(temp, pack.filename), join(project, 'node_modules/vue')], consumer);

  await t.test('the ESM entry works during Vue server rendering', () => {
    runNode(['--input-type=module', '-e', `
import assert from 'node:assert/strict';
import { useClickOutside } from '@stradox/vue3-useclickoutside';
import { createSSRApp, h, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';

const app = createSSRApp({
  setup() {
    useClickOutside(ref(null), () => assert.fail('callback invoked during SSR'));
    return () => h('div', 'SSR');
  },
});
assert.equal(await renderToString(app), '<div>SSR</div>');
`], consumer);
  });

  await t.test('Node can require the CommonJS entry', () => {
    runNode(['--input-type=commonjs', '-e', `
const assert = require('node:assert/strict');
const { useClickOutside } = require('@stradox/vue3-useclickoutside');
assert.equal(typeof useClickOutside, 'function');
`], consumer);
  });

  const esmInput = join(consumer, 'consumer.mts');
  writeFileSync(esmInput, `
import { useClickOutside } from '@stradox/vue3-useclickoutside';
import { ref } from 'vue';
useClickOutside(ref<HTMLElement | null>(null), () => {});
`);

  await t.test('TypeScript resolves the ESM declaration with NodeNext and bundler resolution', () => {
    typecheck(['--module', 'nodenext'], esmInput);
    typecheck(['--module', 'esnext', '--moduleResolution', 'bundler'], esmInput);
  });

  await t.test('TypeScript finds the types fallback without reading exports', () => {
    typecheck(['--module', 'esnext', '--moduleResolution', 'bundler', '--resolvePackageJsonExports', 'false'], esmInput);
  });

  await t.test('TypeScript resolves the CommonJS declaration', () => {
    const input = join(consumer, 'consumer.cts');
    writeFileSync(input, `
import clickOutside = require('@stradox/vue3-useclickoutside');
import { ref } from 'vue';
clickOutside.useClickOutside(ref<HTMLElement | null>(null), () => {});
`);
    typecheck(['--module', 'node16'], input);
  });
});
