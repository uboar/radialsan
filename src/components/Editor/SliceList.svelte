<script lang="ts">
  import { t } from '../../i18n';
  import { getLucideIconName } from '../../utils/lucideIconRegistry';
  import LucideIcon from './LucideIcon.svelte';
  import type { Slice } from '../../types/settings';

  export let slices: Slice[];
  export let selectedId: string | null;
  export let onSelect: (id: string) => void;
  export let onReorder: (slices: Slice[]) => void;
  export let onAdd: () => void;
  export let onDelete: (id: string) => void;

  let draggedId: string | null = null;
  let dragOverId: string | null = null;

  function moveItem(items: Slice[], fromIndex: number, toIndex: number): Slice[] {
    const next = [...items];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    return next;
  }

  function handleDragStart(event: DragEvent, sliceId: string) {
    draggedId = sliceId;
    event.dataTransfer?.setData('text/plain', sliceId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragOver(event: DragEvent, sliceId: string) {
    event.preventDefault();
    dragOverId = sliceId;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDrop(event: DragEvent, targetId: string) {
    event.preventDefault();
    const sourceId = draggedId ?? event.dataTransfer?.getData('text/plain');
    draggedId = null;
    dragOverId = null;

    if (!sourceId || sourceId === targetId) return;

    const oldIndex = slices.findIndex((slice) => slice.id === sourceId);
    const newIndex = slices.findIndex((slice) => slice.id === targetId);
    if (oldIndex < 0 || newIndex < 0) return;

    onReorder(moveItem(slices, oldIndex, newIndex));
  }

  function handleDragEnd() {
    draggedId = null;
    dragOverId = null;
  }

  function handleItemKeyDown(event: KeyboardEvent, sliceId: string) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelect(sliceId);
  }

  function getActionLabel(type: string | undefined): string {
    const actionType = type ?? 'noop';
    return $t(`actions.${actionType}`);
  }
</script>

<div class="space-y-2">
  <div class="mb-2 flex items-center justify-between gap-2">
    <h3 class="text-sm font-semibold text-theme-text-secondary uppercase tracking-wide">{$t('editor.slices')}</h3>
    <button
      type="button"
      on:click={onAdd}
      class="rounded bg-theme-bg-tertiary px-2 py-1 text-xs text-theme-text-primary transition-colors hover:bg-theme-bg-tertiary/80"
    >
      {$t('editor.addSlice')}
    </button>
  </div>

  <div class="space-y-1">
    {#each slices as slice (slice.id)}
      <div
        class="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors {slice.id === selectedId
          ? 'bg-blue-600/20 border border-blue-500/50'
          : 'bg-theme-bg-tertiary/50 border border-transparent hover:bg-theme-bg-tertiary'} {dragOverId === slice.id && draggedId !== slice.id
          ? 'ring-1 ring-blue-500/70'
          : ''}"
        role="button"
        tabindex="0"
        aria-pressed={slice.id === selectedId}
        draggable="true"
        on:click={() => onSelect(slice.id)}
        on:keydown={(event) => handleItemKeyDown(event, slice.id)}
        on:dragstart={(event) => handleDragStart(event, slice.id)}
        on:dragover={(event) => handleDragOver(event, slice.id)}
        on:drop={(event) => handleDrop(event, slice.id)}
        on:dragleave={() => {
          if (dragOverId === slice.id) dragOverId = null;
        }}
        on:dragend={handleDragEnd}
      >
        <span class="shrink-0 cursor-grab px-1 text-theme-text-muted hover:text-theme-text-primary">⠿</span>
        <span class="flex h-6 w-6 shrink-0 items-center justify-center text-lg">
          {#if getLucideIconName(slice.icon)}
            <LucideIcon icon={slice.icon} size={20} />
          {:else}
            {slice.icon}
          {/if}
        </span>
        <span class="flex-1 text-sm truncate">{slice.label}</span>
        <span class="max-w-28 shrink-0 truncate text-xs text-theme-text-muted">{getActionLabel(slice.actions[0]?.type)}</span>
        <button
          type="button"
          on:click|stopPropagation={() => onDelete(slice.id)}
          class="shrink-0 px-1 text-sm text-theme-text-muted hover:text-red-400"
        >
          ×
        </button>
      </div>
    {/each}
  </div>
</div>
