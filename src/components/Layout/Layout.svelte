<script lang="ts">
  import RuntimeStatusBanner from './RuntimeStatusBanner.svelte';
  import Sidebar from './Sidebar.svelte';
</script>

<div class="flex h-screen bg-theme-bg-primary text-theme-text-primary">
  <Sidebar />
  <main class="flex-1 overflow-auto p-6">
    <RuntimeStatusBanner />
    <slot />
  </main>
</div>
