import { useClickOutside } from '@stradox/vue3-useclickoutside';
import { createApp, defineComponent, h, reactive, ref } from 'vue';

const PanelContent = defineComponent({
  props: {
    name: { type: String, required: true },
    target: { type: Object, required: true },
    options: Object,
  },
  emits: ['dismiss'],
  setup(props, { emit, slots }) {
    useClickOutside(props.target, () => emit('dismiss'), props.options);
    return () => h('div', [
      h('button', { type: 'button' }, `Inside ${props.name}`),
      slots.default?.(),
    ]);
  },
});

const Panel = defineComponent({
  props: { state: { type: Object, required: true }, options: Object },
  setup({ state, options }, { slots }) {
    const target = ref(null);

    function dismiss() {
      state.dismissals += 1;
      state.open = false;
    }

    return () => h('section', { ref: target }, [
      h('button', {
        type: 'button',
        onClick: () => { state.open = true; },
      }, `Open ${state.name}`),
      state.open ? h(PanelContent, { name: state.name, target, options, onDismiss: dismiss }, slots) : null,
    ]);
  },
});

function panelState(name) {
  return reactive({ name, open: false, dismissals: 0 });
}

createApp({
  setup() {
    const panels = [1, 2, 3, 4, 5].map(number => panelState(`panel ${number}`));
    const nested = panelState('nested panel');
    const externalOpener = ref(null);
    const firstPanelOptions = { ignore: [externalOpener] };

    function openAll(event) {
      // Keep the setup click from dismissing the panels as they mount.
      event.stopPropagation();
      for (const panel of panels) panel.open = true;
    }

    return () => h('main', [
      h('button', { type: 'button', onClick: openAll }, 'Open all panels'),
      ...panels.map(state => h(Panel, {
        key: state.name,
        state,
        options: state === panels[0] ? firstPanelOptions : undefined,
      }, state === panels[2]
        ? { default: () => h(Panel, { state: nested }) }
        : undefined)),
      h('button', { type: 'button' }, 'Outside all panels'),
      h('button', {
        type: 'button',
        ref: externalOpener,
        onClick: () => { panels[0].open = true; },
      }, 'Open panel 1 from outside'),
      ...[...panels, nested].map(state => h('output', {
        key: state.name,
        'aria-label': `${state.name} dismissals`,
      }, String(state.dismissals))),
    ]);
  },
}).mount('#app');
