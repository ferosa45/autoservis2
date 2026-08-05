'use client';

import { useTransition } from 'react';
import { toggleTask } from '@/lib/actions/today.actions';
import { cn } from '@/lib/utils';

type TaskItem = {
  id: string;
  title: string;
  completed: boolean;
  job: { vehicle: { brand: string; model: string } } | null;
};

export function TasksPanel({ tasks }: { tasks: TaskItem[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-text-primary">
          Úkoly na dnes <span className="text-text-muted">({tasks.length})</span>
        </h3>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-text-muted">Žádné otevřené úkoly.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-start gap-2.5">
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(() => toggleTask(task.id, !task.completed))}
                className={cn(
                  'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                  task.completed ? 'border-status-done-text bg-status-done-bg' : 'border-border hover:border-primary'
                )}
                aria-label={task.completed ? 'Označit jako nesplněné' : 'Označit jako splněné'}
              >
                {task.completed && <span className="h-2 w-2 rounded-sm bg-status-done-text" />}
              </button>
              <span className={cn('text-sm', task.completed ? 'text-text-muted line-through' : 'text-text-primary')}>
                {task.title}
                {task.job && (
                  <span className="text-text-muted"> — {task.job.vehicle.brand} {task.job.vehicle.model}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
