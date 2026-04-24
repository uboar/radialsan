<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { Component } from 'svelte';
  import Layout from './components/Layout/Layout.svelte';
  import Dashboard from './pages/Dashboard.svelte';
  import GlobalSettings from './pages/GlobalSettings.svelte';
  import Profiles from './pages/Profiles.svelte';
  import { route } from './stores/router';
  import { settingsStore } from './stores/settingsStore';
  import type { AppTheme } from './types/settings';

  let MenuEditor: Component<Record<string, string>> | null = null;
  let mediaQuery: MediaQueryList | null = null;

  function applyThemeClass(theme: AppTheme) {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }

  function handleSystemThemeChange() {
    applyThemeClass('system');
  }

  async function loadMenuEditor() {
    if (MenuEditor) return;
    const module = await import('./pages/MenuEditor.svelte');
    MenuEditor = module.default;
  }

  onMount(() => {
    void settingsStore.loadSettings();
  });

  $: theme = $settingsStore.settings?.global.theme ?? 'dark';

  $: {
    applyThemeClass(theme);
    mediaQuery?.removeEventListener('change', handleSystemThemeChange);
    mediaQuery = null;

    if (theme === 'system') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    }
  }

  $: if ($route.name === 'menu') {
    void loadMenuEditor();
  }

  onDestroy(() => {
    mediaQuery?.removeEventListener('change', handleSystemThemeChange);
  });
</script>

<Layout>
  {#if $route.name === 'dashboard'}
    <Dashboard />
  {:else if $route.name === 'profiles'}
    <Profiles />
  {:else if $route.name === 'settings'}
    <GlobalSettings />
  {:else if $route.name === 'menu'}
    {#if MenuEditor}
      <svelte:component this={MenuEditor} id={$route.params.id} />
    {:else}
      <div class="text-theme-text-secondary">Menu editor migration is pending for this route.</div>
    {/if}
  {:else}
    <div class="text-theme-text-secondary">Page not found</div>
  {/if}
</Layout>
