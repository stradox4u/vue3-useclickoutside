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