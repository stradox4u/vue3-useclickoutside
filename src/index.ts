import { onBeforeUnmount, onMounted } from "vue";
import type { Ref } from "vue";

export interface UseClickOutsideOptions {
  ignore?: readonly Readonly<Ref<Element | null | undefined>>[];
}

export function useClickOutside(
  el_target_ref: Ref<HTMLElement | null>,
  callback_fn: () => void,
  options?: UseClickOutsideOptions,
) {
  if (!el_target_ref) {
    return;
  }

  const listener = (event: Event) => {
    const target = el_target_ref.value;
    if (!target || event.target === target) return;

    const path = event.composedPath();
    if (path.includes(target)) return;

    const isIgnored = options?.ignore?.some(({ value }) =>
      value != null && (event.target === value || path.includes(value)),
    );
    if (!isIgnored && typeof callback_fn === 'function') {
      callback_fn();
    }
  };

  onMounted(() => {
    window.addEventListener('click', listener);
  })
  onBeforeUnmount(() => {
    window.removeEventListener('click', listener);
  })
  return { listener }
}
