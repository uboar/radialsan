import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Slice } from '../../types/settings';

interface SliceListProps {
  slices: Slice[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (slices: Slice[]) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

const SortableSliceItem: React.FC<{
  slice: Slice;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}> = ({ slice, isSelected, onSelect, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slice.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-theme-bg-tertiary/50 border border-transparent hover:bg-theme-bg-tertiary'
      }`}
      onClick={onSelect}
    >
      <span {...attributes} {...listeners} className="cursor-grab text-theme-text-muted hover:text-theme-text-primary px-1">⠿</span>
      <span className="text-lg">{slice.icon}</span>
      <span className="flex-1 text-sm truncate">{slice.label}</span>
      <span className="text-xs text-theme-text-muted">{slice.actions[0]?.type || 'noop'}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="text-theme-text-muted hover:text-red-400 text-sm px-1"
      >
        ×
      </button>
    </div>
  );
};

export const SliceList: React.FC<SliceListProps> = ({
  slices, selectedId, onSelect, onReorder, onAdd, onDelete,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = slices.findIndex((s) => s.id === active.id);
      const newIndex = slices.findIndex((s) => s.id === over.id);
      onReorder(arrayMove(slices, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-theme-text-secondary uppercase tracking-wide">Slices</h3>
        <button
          onClick={onAdd}
          className="text-xs px-2 py-1 bg-theme-bg-tertiary hover:bg-theme-bg-tertiary/80 rounded text-theme-text-primary transition-colors"
        >
          + Add
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slices.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {slices.map((slice) => (
              <SortableSliceItem
                key={slice.id}
                slice={slice}
                isSelected={slice.id === selectedId}
                onSelect={() => onSelect(slice.id)}
                onDelete={() => onDelete(slice.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
