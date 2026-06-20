// Ordering — drag-and-drop sequencing for `ordering` questions. The user
// arranges steps into the correct order. Built on @dnd-kit's sortable preset.

import { useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import type { QuestionTypeProps } from './types';
import { shuffle } from '../../services/ExamGenerator';
import type { Answer } from '../../types/Question';

interface RowProps {
  step: Answer;
  index: number;
  reveal?: boolean;
  correctIndex: number;
  disabled?: boolean;
}

function SortableRow({ step, index, reveal, correctIndex, disabled }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
    disabled,
  });

  const inRightPlace = reveal && index === correctIndex;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  let stateClass = 'border-slate-300 bg-white dark:border-navy-600 dark:bg-navy-800';
  if (reveal) {
    stateClass = inRightPlace
      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
      : 'border-rose-500 bg-rose-50 dark:bg-rose-500/10';
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border-2 p-3 ${stateClass} ${
        disabled ? '' : 'cursor-grab active:cursor-grabbing'
      }`}
      {...attributes}
      {...listeners}
    >
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-azure-500 text-xs font-bold text-white">
        {index + 1}
      </span>
      <span className="flex-1 text-sm text-slate-800 dark:text-slate-100">{step.text}</span>
      {!disabled && !reveal && (
        <span className="text-slate-400 dark:text-navy-500" aria-hidden>
          ⋮⋮
        </span>
      )}
      {reveal && (
        <span
          className={`text-xs font-semibold ${
            inRightPlace ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {inRightPlace ? '✓' : `should be #${correctIndex + 1}`}
        </span>
      )}
    </li>
  );
}

export function Ordering({ question, response, onRespond, reveal, disabled }: QuestionTypeProps) {
  const steps = question.steps ?? [];
  const correctOrder = question.correctOrder ?? [];

  // Establish a stable initial (shuffled) order the first time the question is shown.
  const initialOrder = useMemo(() => {
    if (response?.order && response.order.length === steps.length) return response.order;
    return shuffle(steps.map((s) => s.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  // Persist the shuffled starting order so grading and resume are consistent.
  useEffect(() => {
    if (!response?.order) onRespond({ order: initialOrder });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const order = response?.order ?? initialOrder;
  const orderedSteps = order
    .map((id) => steps.find((s) => s.id === id))
    .filter((s): s is Answer => Boolean(s));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onRespond({ order: arrayMove(order, oldIndex, newIndex) });
  };

  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-azure-600 dark:text-azure-300">
        Drag the steps into the correct order
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {orderedSteps.map((step, index) => (
              <SortableRow
                key={step.id}
                step={step}
                index={index}
                reveal={reveal}
                correctIndex={correctOrder.indexOf(step.id)}
                disabled={disabled}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
