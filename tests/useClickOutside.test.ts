// @vitest-environment jsdom

import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createApp, ref, type App, type Ref } from 'vue';
import { useClickOutside, type UseClickOutsideOptions } from '../src/index';

let app: App | undefined;
let root: HTMLElement;
let target: HTMLElement;
let child: HTMLButtonElement;
let outside: HTMLButtonElement;

function mountComposable(
  targetRef: Ref<HTMLElement | null>,
  callback: () => void,
  options?: UseClickOutsideOptions,
) {
  const container = document.createElement('div');
  root.append(container);
  app = createApp({
    setup() {
      useClickOutside(targetRef, callback, options);
      return () => null;
    },
  });
  app.mount(container);
}

function unmountComposable() {
  app?.unmount();
  app = undefined;
}

beforeEach(() => {
  root = document.createElement('div');
  target = document.createElement('div');
  child = document.createElement('button');
  outside = document.createElement('button');
  target.append(child);
  root.append(target, outside);
  document.body.append(root);
});

afterEach(() => {
  unmountComposable();
  root.remove();
});

test('ignores clicks on the target and its descendants', () => {
  const callback = vi.fn();
  mountComposable(ref(target), callback);

  target.click();
  child.click();

  expect(callback).not.toHaveBeenCalled();
});

test('calls the callback once per outside click', () => {
  const callback = vi.fn();
  mountComposable(ref(target), callback);

  outside.click();
  expect(callback).toHaveBeenCalledOnce();

  outside.click();
  expect(callback).toHaveBeenCalledTimes(2);
});

test('ignores the current elements and their descendants in the ignore list', () => {
  const callback = vi.fn();
  const opener = document.createElement('button');
  const icon = document.createElement('span');
  opener.append(icon);
  root.append(opener);

  const openerRef = ref<HTMLButtonElement | null>(null);
  mountComposable(ref(target), callback, { ignore: [ref<HTMLElement>(), openerRef] });

  opener.click();
  expect(callback).toHaveBeenCalledOnce();

  openerRef.value = opener;
  opener.click();
  icon.click();
  expect(callback).toHaveBeenCalledOnce();

  outside.click();
  expect(callback).toHaveBeenCalledTimes(2);

  openerRef.value = null;
  icon.click();
  expect(callback).toHaveBeenCalledTimes(3);
});

test('starts detecting clicks once the target ref is set', () => {
  const callback = vi.fn();
  const targetRef = ref<HTMLElement | null>(null);
  mountComposable(targetRef, callback);

  outside.click();
  expect(callback).not.toHaveBeenCalled();

  targetRef.value = target;
  outside.click();
  expect(callback).toHaveBeenCalledOnce();
});

test('follows the current target when the ref changes or is cleared', () => {
  const callback = vi.fn();
  const targetRef = ref<HTMLElement | null>(target);
  mountComposable(targetRef, callback);

  targetRef.value = outside;
  outside.click();
  expect(callback).not.toHaveBeenCalled();

  child.click();
  expect(callback).toHaveBeenCalledOnce();

  targetRef.value = null;
  child.click();
  expect(callback).toHaveBeenCalledOnce();
});

test('stops detecting outside clicks after the component unmounts', () => {
  const callback = vi.fn();
  mountComposable(ref(target), callback);

  outside.click();
  expect(callback).toHaveBeenCalledOnce();

  unmountComposable();
  outside.click();
  expect(callback).toHaveBeenCalledOnce();
});
