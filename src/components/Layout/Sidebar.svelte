<script lang="ts">
  import { CircleDot, Settings, UsersRound } from "lucide-svelte";
  import { t } from "../../i18n";
  import { handleLinkClick, route } from "../../stores/router";

  const navItems = [
    { to: "/", labelKey: "nav.menus", icon: CircleDot },
    { to: "/profiles", labelKey: "nav.profiles", icon: UsersRound },
    { to: "/settings", labelKey: "nav.settings", icon: Settings },
  ];

  function isActive(to: string) {
    return to === "/" ? $route.name === "dashboard" : $route.path === to;
  }
</script>

<nav
  class="glass-panel-strong z-10 m-3 mr-0 flex h-[calc(100vh-1.5rem)] w-16 shrink-0 flex-col items-center rounded-[10px] p-2"
>
  <h1
    class="mb-4 mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300/15 text-[0.7rem] font-black leading-none text-cyan-200"
    title={$t("app.name")}
  >
    RS
  </h1>
  {#each navItems as item (item.to)}
    {@const Icon = item.icon}
    <a
      href={item.to}
      onclick={(event) => handleLinkClick(event, item.to)}
      class={`relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
        isActive(item.to)
          ? "bg-cyan-300/15 text-cyan-200"
          : "text-theme-text-secondary hover:bg-theme-bg-tertiary/70 hover:text-theme-text-primary"
      }`}
      aria-label={$t(item.labelKey)}
      title={$t(item.labelKey)}
    >
      {#if isActive(item.to)}
        <span
          class="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-cyan-300"
        ></span>
      {/if}
      <svelte:component this={Icon} size={19} strokeWidth={2.2} />
      <span class="sr-only">{$t(item.labelKey)}</span>
    </a>
  {/each}
</nav>
