<script lang="ts">
  import RuntimeStatusBanner from "./RuntimeStatusBanner.svelte";
  import Sidebar from "./Sidebar.svelte";
</script>

<div
  class="flex h-screen overflow-hidden bg-theme-bg-primary text-theme-text-primary"
>
  <Sidebar />
  <main class="min-w-0 flex-1 overflow-auto">
    <div class="mx-auto w-full max-w-7xl px-6 py-6 lg:px-8">
      <RuntimeStatusBanner />
      <slot />
    </div>
  </main>
</div>
