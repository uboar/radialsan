<script lang="ts">
  import { X } from "lucide-svelte";
  import { t } from "../../i18n";
  import { settingsStore } from "../../stores/settingsStore";
  import RuntimeStatusBanner from "./RuntimeStatusBanner.svelte";
  import Sidebar from "./Sidebar.svelte";

  $: saveErrorDetail = formatSaveErrorDetail($settingsStore.error);

  function formatSaveErrorDetail(error: string | null) {
    if (!error) return null;
    const trimmed = error.trim();
    if (!trimmed || trimmed === "[object Object]") return null;
    return trimmed;
  }
</script>

<div
  class="flex h-screen overflow-hidden bg-theme-bg-primary text-theme-text-primary"
>
  <Sidebar />
  <main class="min-w-0 flex-1 overflow-auto">
    <div class="mx-auto w-full max-w-7xl px-6 py-6 lg:px-8">
      <RuntimeStatusBanner />
      {#if $settingsStore.error}
        <section
          class="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"
          role="alert"
        >
          <div class="flex gap-3">
            <div class="min-w-0 flex-1">
              <h2 class="text-sm font-semibold text-amber-200">
                {$t("saveError.title")}
              </h2>
              <p class="mt-1 text-sm text-theme-text-secondary">
                {$t("saveError.body")}
              </p>
              {#if saveErrorDetail}
                <p class="mt-2 text-xs text-theme-text-muted">
                  {$t("saveError.details", { detail: saveErrorDetail })}
                </p>
              {/if}
            </div>
            <button
              type="button"
              class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-theme-text-secondary hover:bg-theme-bg-secondary hover:text-theme-text-primary"
              aria-label={$t("saveError.dismiss")}
              title={$t("saveError.dismiss")}
              on:click={() => settingsStore.clearError()}
            >
              <X size={16} />
            </button>
          </div>
        </section>
      {/if}
      <slot />
    </div>
  </main>
</div>
