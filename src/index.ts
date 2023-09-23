import { Ref, onBeforeUnmount, onMounted } from "vue";

export function useClickOutside(el_target_ref: Ref<HTMLElement | null>, callback_fn: () => void) {
  if (!el_target_ref) {
    return;
  }

  let listener = (e: Event) => {
    if (!el_target_ref.value) return;
    if (e.target == el_target_ref.value || e.composedPath().includes(el_target_ref.value)) {
      return;
    } else {
      if (typeof callback_fn == 'function') {
        callback_fn();
      }
    }

  }

  onMounted(() => {
    window.addEventListener('click', listener);
  })
  onBeforeUnmount(() => {
    window.removeEventListener('click', listener);
  })
  return { listener }
}