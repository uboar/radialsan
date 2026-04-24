<script lang="ts">
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
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between mb-2">
    <h3 class="text-sm font-semibold text-theme-text-secondary uppercase tracking-wide">Slices</h3>
    <button
      type="button"
      on:click={onAdd}
      class="text-xs px-2 py-1 bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 rounded text-theme-text-primary transition-colors"
    >
      + Add
    </button>
  </div>

  <div class="space-y-1">
    {#each slices as slice (slice.id)}
      <div
        class="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors {slice.id === selectedId
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
        <span class="cursor-grab text-theme-text-muted hover:text-theme-text-primary px-1">⠿</span>
        <span class="text-lg">{slice.icon}</span>
        <span class="flex-1 text-sm truncate">{slice.label}</span>
        <span class="text-xs text-theme-text-muted">{slice.actions[0]?.type || 'noop'}</span>
        <button
          type="button"
          on:click|stopPropagation={() => onDelete(slice.id)}
          class="text-theme-text-muted hover:text-red-400 text-sm px-1"
        >
          ×
        </button>
      </div>
    {/each}
  </div>
</div>
