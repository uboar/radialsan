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

<nav class="w-56 min-h-screen bg-theme-bg-secondary border-r border-theme-border p-4 flex flex-col gap-1">
  <h1 class="text-lg font-bold text-theme-text-primary mb-6 px-2">radialsan</h1>
  {#each navItems as item (item.to)}
    <a
      href={item.to}
      onclick={(event) => handleLinkClick(event, item.to)}
      class={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive(item.to)
          ? 'bg-theme-bg-tertiary text-theme-text-primary'
          : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/50'
      }`}
    >
      <span>{item.icon}</span>
      <span>{$t(item.labelKey)}</span>
    </a>
  {/each}
</nav>
