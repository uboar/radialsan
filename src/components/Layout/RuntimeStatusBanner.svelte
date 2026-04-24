<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { t } from '../../i18n';
  import type { RuntimeStatus } from '../../types/settings';

  const DEFAULT_STATUS: RuntimeStatus = {
    inputMonitoringAvailable: true,
    activeWindowMonitoringAvailable: true,
    inputMonitoringDetail: null,
    activeWindowMonitoringDetail: null,
  };

  let status = DEFAULT_STATUS;
  let unlisten: (() => void) | undefined;

  onMount(() => {
    void setupRuntimeStatus();
  });

  onDestroy(() => {
    unlisten?.();
  });

  async function setupRuntimeStatus() {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const { listen } = await import('@tauri-apps/api/event');

      status = await invoke<RuntimeStatus>('get_runtime_status');
      unlisten = await listen<RuntimeStatus>('radialsan://runtime-status', (event) => {
        status = event.payload;
      });
    } catch {
      // Not running inside Tauri.
    }
  }

  $: warnings = [
    !status.inputMonitoringAvailable
      ? {
          key: 'input-monitoring',
          title: $t('runtimeWarnings.inputMonitoringTitle'),
          body: $t('runtimeWarnings.inputMonitoringBody'),
          detail: status.inputMonitoringDetail,
        }
      : null,
    !status.activeWindowMonitoringAvailable
      ? {
          key: 'active-window-monitoring',
          title: $t('runtimeWarnings.activeWindowTitle'),
          body: $t('runtimeWarnings.activeWindowBody'),
          detail: status.activeWindowMonitoringDetail,
        }
      : null,
  ].filter((warning): warning is { key: string; title: string; body: string; detail: string | null } => warning !== null);
</script>

{#if warnings.length > 0}
  <section class="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
    <h2 class="text-sm font-semibold text-amber-200">
      {$t('runtimeWarnings.title')}
    </h2>
    <div class="mt-3 space-y-3">
      {#each warnings as warning (warning.key)}
        <div class="rounded-lg border border-amber-500/20 bg-theme-bg-secondary/70 p-3">
          <p class="text-sm font-medium text-theme-text-primary">{warning.title}</p>
          <p class="mt-1 text-sm text-theme-text-secondary">{warning.body}</p>
          {#if warning.detail}
            <p class="mt-2 text-xs text-theme-text-muted">
              {$t('runtimeWarnings.details', { detail: warning.detail })}
            </p>
          {/if}
        </div>
      {/each}
    </div>
  </section>
{/if}
