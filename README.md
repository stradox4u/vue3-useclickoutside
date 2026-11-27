# Vue3-UseClickOutside

A Vue 3 composable that allows you to run actions when clicking outside an element. Useful for closing modals, dropdowns, etc.

## Installation

```bash
$ npm install @stradox/vue3-useclickoutside
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useClickOutside } from '@stradox/vue3-useclickoutside';

const relevantRef = ref<HTMLElement | null>(null);

useClickOutside(relevantRef, () => {
  // do something
});
</script>

<template>
  <div>
    <div ref="relevantRef">Click outside me</div>
  </div>
</template>
```

### Ignore an opener

Pass the opener's ref in `ignore` so it can sit outside the panel. Clicks on the opener and its descendants still reach other listeners.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useClickOutside } from '@stradox/vue3-useclickoutside';

const open = ref(false);
const panel = ref<HTMLElement | null>(null);
const opener = ref<HTMLButtonElement | null>(null);

useClickOutside(panel, () => { open.value = false; }, { ignore: [opener] });
</script>

<template>
  <button ref="opener" type="button" @click="open = !open">Toggle panel</button>
  <section v-if="open" ref="panel">Panel content</section>
</template>
```

## Development

Use Node.js 24.15 or newer on the Node.js 24 release line.

```bash
npm ci
npm test
```

The tests exercise the composable in Vue and install the npm tarball in a temporary consumer project. `npm pack` builds the library automatically.

Run the browser smoke tests against the packed library in Chromium, Firefox, and WebKit, the engine Safari uses.

```bash
npx playwright install --only-shell chromium firefox webkit
npm run test:browser
```
