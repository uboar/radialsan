import { mount } from 'svelte';
import Overlay from './components/Overlay.svelte';

const target = document.getElementById('overlay-root');

if (!target) {
  throw new Error('Root element #overlay-root was not found');
}

mount(Overlay, { target });
