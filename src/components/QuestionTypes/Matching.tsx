// Matching — drag-and-drop matching of definitions (draggable chips) onto terms
// (drop targets). Unassigned definitions live in a pool that is itself a drop
// target, so a definition can be dragged back out to unassign it.

import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import type { QuestionTypeProps } from './types';
import type { MatchDefinition } from '../../types/Question';

const POOL_ID = '__pool__';

function DefinitionChip({
  def,
  reveal,
  correct,
  disabled,
}: {
  def: MatchDefinition;
  reveal?: boolean;
  correct?: boolean;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: def.id,
    disabled,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  let tone = 'border-slate-300 bg-white dark:border-navy-600 dark:bg-navy-800';
  if (reveal) {
    tone =
      correct === true
        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
        : correct === false
          ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10'
          : tone;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-lg border-2 px-3 py-2 text-sm text-slate-800 shadow-sm dark:text-slate-100 ${tone} ${
        disabled ? '' : 'cursor-grab active:cursor-grabbing'
      } ${isDragging ? 'opacity-70' : ''}`}
    >
      {def.text}
    </div>
  );
}

function TermSlot({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children?: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="flex items-stretch gap-3">
      <div className="flex w-2/5 flex-none items-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-navy-800 dark:text-slate-200">
        {label}
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[3rem] flex-1 items-center rounded-lg border-2 border-dashed px-2 py-1 transition-colors ${
          isOver
            ? 'border-azure-500 bg-azure-50 dark:bg-azure-500/10'
            : 'border-slate-300 dark:border-navy-600'
        }`}
      >
        {children ?? (
          <span className="px-1 text-xs italic text-slate-400 dark:text-navy-400">
            Drop a definition here
          </span>
        )}
      </div>
    </div>
  );
}

export function Matching({ question, response, onRespond, reveal, disabled }: QuestionTypeProps) {
  const terms = question.terms ?? [];
  const definitions = question.definitions ?? [];
  const correctPairs = question.correctPairs ?? [];
  const pairs = response?.pairs ?? {};

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const defById = (id: string) => definitions.find((d) => d.id === id);
  const correctDefForTerm = (termId: string) =>
    correctPairs.find((p) => p.termId === termId)?.definitionId;
  const assignedDefIds = new Set(Object.values(pairs));
  const poolDefs = definitions.filter((d) => !assignedDefIds.has(d.id));

  const { setNodeRef: setPoolRef, isOver: poolOver } = useDroppable({ id: POOL_ID });

  const onDragEnd = (event: DragEndEvent) => {
    if (disabled) return;
    const { active, over } = event;
    if (!over) return;
    const defId = String(active.id);
    const target = String(over.id);

    // Remove this definition from any term it currently occupies.
    const next: Record<string, string> = {};
    Object.entries(pairs).forEach(([termId, dId]) => {
      if (dId !== defId) next[termId] = dId;
    });

    if (target !== POOL_ID) {
      // Assigning to a term replaces whatever was there.
      next[target] = defId;
    }
    onRespond({ pairs: next });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Terms with their drop slots */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-azure-600 dark:text-azure-300">
            Terms
          </h4>
          {terms.map((t) => {
            const assignedDefId = pairs[t.id];
            const def = assignedDefId ? defById(assignedDefId) : undefined;
            const isCorrect =
              reveal && assignedDefId ? correctDefForTerm(t.id) === assignedDefId : undefined;
            return (
              <TermSlot key={t.id} id={t.id} label={t.text}>
                {def && (
                  <DefinitionChip def={def} reveal={reveal} correct={isCorrect} disabled={disabled} />
                )}
                {reveal && !isCorrect && (
                  <span className="ml-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    → {defById(correctDefForTerm(t.id) ?? '')?.text}
                  </span>
                )}
              </TermSlot>
            );
          })}
        </div>

        {/* Pool of unassigned definitions */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-azure-600 dark:text-azure-300">
            Definitions
          </h4>
          <div
            ref={setPoolRef}
            className={`flex min-h-[8rem] flex-col gap-2 rounded-xl border-2 border-dashed p-3 transition-colors ${
              poolOver ? 'border-azure-500 bg-azure-50 dark:bg-azure-500/10' : 'border-slate-300 dark:border-navy-600'
            }`}
          >
            {poolDefs.length === 0 ? (
              <span className="text-xs italic text-slate-400 dark:text-navy-400">
                All definitions placed
              </span>
            ) : (
              poolDefs.map((d) => (
                <DefinitionChip key={d.id} def={d} disabled={disabled} />
              ))
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
