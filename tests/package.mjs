import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { preparePackedConsumer, runNode } from './packed-consumer.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const tsc = join(project, 'node_modules/typescript/bin/tsc');

function typecheck(compilerOptions, file) {
  runNode([tsc, '--noEmit', '--strict', '--skipLibCheck', '--target', 'ES2020',
    ...compilerOptions, file], dirname(file));
}

test('the packed package works in a Vue consumer project', async (t) => {
  const { directory: consumer, files, cleanup } = preparePackedConsumer();
  t.after(cleanup);

  await t.test('the tarball contains the library, README, and license', () => {
    assert.deepEqual(files.map(({ path }) => path).sort(), [
      'LICENSE',
      'README.md',
      'dist/types/index.d.cts',
      'dist/types/index.d.ts',
      'dist/use-click-outside.js',
      'dist/use-click-outside.umd.cjs',
      'package.json',
    ]);
  });

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
import { useClickOutside, type UseClickOutsideOptions } from '@stradox/vue3-useclickoutside';
import { ref, shallowReadonly } from 'vue';
const options: UseClickOutsideOptions = {
  ignore: [shallowReadonly(ref<HTMLButtonElement | null>(null)), ref<SVGSVGElement>()] as const,
};
useClickOutside(ref<HTMLElement | null>(null), () => {}, options);
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
clickOutside.useClickOutside(ref<HTMLElement | null>(null), () => {}, { ignore: [ref<HTMLButtonElement>()] });
`);
    typecheck(['--module', 'node16'], input);
  });
});
