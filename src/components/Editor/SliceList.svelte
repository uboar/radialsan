<script lang="ts">
  import { GripVertical, Plus, Trash2 } from "lucide-svelte";
  import { t } from "../../i18n";
  import { getLucideIconName } from "../../utils/lucideIconRegistry";
  import LucideIcon from "./LucideIcon.svelte";
  import type { Slice } from "../../types/settings";

  export let slices: Slice[];
  export let selectedId: string | null;
  export let onSelect: (id: string) => void;
  export let onReorder: (slices: Slice[]) => void;
  export let onAdd: () => void;
  export let onDelete: (id: string) => void;

  let draggedId: string | null = null;
  let dragOverId: string | null = null;

  function moveItem(
    items: Slice[],
    fromIndex: number,
    toIndex: number,
  ): Slice[] {
    const next = [...items];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    return next;
  }

  function handleDragStart(event: DragEvent, sliceId: string) {
    draggedId = sliceId;
    event.dataTransfer?.setData("text/plain", sliceId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function handleDragOver(event: DragEvent, sliceId: string) {
    event.preventDefault();
    dragOverId = sliceId;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }

  function handleDrop(event: DragEvent, targetId: string) {
    event.preventDefault();
    const sourceId = draggedId ?? event.dataTransfer?.getData("text/plain");
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
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(sliceId);
  }

  function getActionLabel(type: string | undefined): string {
    const actionType = type ?? "noop";
    return $t(`actions.${actionType}`);
  }
</script>

<div class="space-y-2">
  <div class="mb-3 flex items-center justify-between gap-2">
    <h3 class="section-label">
      {$t("editor.slices")}
    </h3>
    <button type="button" on:click={onAdd} class="secondary-command px-2 py-1">
      <Plus size={14} />
      {$t("editor.addSlice")}
    </button>
  </div>

  <div class="space-y-1.5">
    {#each slices as slice (slice.id)}
      <div
        class="group flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border p-2 transition-colors {slice.id ===
        selectedId
          ? 'border-cyan-300/50 bg-cyan-300/15 text-theme-text-primary shadow-[0_0_0_1px_rgba(110,231,249,0.08)]'
          : 'border-transparent bg-theme-bg-tertiary/45 text-theme-text-secondary hover:border-theme-border hover:bg-theme-bg-tertiary/80 hover:text-theme-text-primary'} {dragOverId ===
          slice.id && draggedId !== slice.id
          ? 'ring-1 ring-cyan-300/70'
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
        <span
          class="flex h-7 w-4 shrink-0 cursor-grab items-center justify-center text-theme-text-muted group-hover:text-theme-text-secondary"
        >
          <GripVertical size={15} />
        </span>
        <span class="flex h-6 w-6 shrink-0 items-center justify-center text-lg">
          {#if getLucideIconName(slice.icon)}
            <LucideIcon icon={slice.icon} size={20} />
          {:else}
            {slice.icon}
          {/if}
        </span>
        <span class="flex-1 truncate text-sm font-medium">{slice.label}</span>
        <span class="max-w-28 shrink-0 truncate text-xs text-theme-text-muted"
          >{getActionLabel(slice.actions[0]?.type)}</span
        >
        <button
          type="button"
          on:click|stopPropagation={() => onDelete(slice.id)}
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-theme-text-muted transition-colors hover:bg-[#FF6B7A]/10 hover:text-[#FF8A96]"
          title={$t("common.delete")}
        >
          <Trash2 size={14} />
        </button>
      </div>
    {/each}
  </div>
</div>
