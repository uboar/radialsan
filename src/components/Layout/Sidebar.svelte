<script lang="ts">
  import { t } from '../../i18n';
  import { handleLinkClick, route } from '../../stores/router';

  const navItems = [
    { to: '/', labelKey: 'nav.menus', icon: '◎' },
    { to: '/profiles', labelKey: 'nav.profiles', icon: '👤' },
    { to: '/settings', labelKey: 'nav.settings', icon: '⚙' },
  ];

  function isActive(to: string) {
    return to === '/' ? $route.name === 'dashboard' : $route.path === to;
  }
</script>

<nav class="flex h-screen w-64 shrink-0 flex-col gap-1 border-r border-theme-border bg-theme-bg-secondary p-5">
  <h1 class="mb-7 truncate px-2 text-xl font-bold leading-tight text-theme-text-primary">radialsan</h1>
  {#each navItems as item (item.to)}
    <a
      href={item.to}
      onclick={(event) => handleLinkClick(event, item.to)}
      class={`flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        isActive(item.to)
          ? 'bg-theme-bg-tertiary text-theme-text-primary'
          : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/50'
      }`}
    >
      <span class="flex w-5 shrink-0 justify-center">{item.icon}</span>
      <span class="truncate">{$t(item.labelKey)}</span>
    </a>
  {/each}
</nav>
