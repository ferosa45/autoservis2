'use client';

import { useState, useTransition } from 'react';
import { Wrench, Plus, X } from 'lucide-react';
import { addJobTask, toggleJobTask, removeJobTask } from '@/lib/actions/job-detail.actions';
import { getActionErrorMessage } from '@/lib/action-errors';
import { cn } from '@/lib/utils';

type Task = { id: string; title: string; completed: boolean };

export function TaskChecklist({ jobId, tasks }: { jobId: string; tasks: Task[] }) {
  const [newTitle, setNewTitle] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    setError(null);
    startTransition(async () => {
      try {
        await addJobTask(jobId, title);
        setNewTitle('');
      } catch (err) {
        setError(getActionErrorMessage(err, 'Práci se nepodařilo přidat.'));
      }
    });
  }

  function handleToggle(task: Task) {
    setError(null);
    startTransition(async () => {
      try {
        await toggleJobTask(task.id, !task.completed, jobId);
      } catch (err) {
        setError(getActionErrorMessage(err, 'Práci se nepodařilo upravit.'));
      }
    });
  }

  function handleRemove(taskId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await removeJobTask(taskId, jobId);
      } catch (err) {
        setError(getActionErrorMessage(err, 'Práci se nepodařilo odebrat.'));
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <Wrench className="h-3.5 w-3.5" />
        Práce
      </div>

      <ul className="space-y-1.5">
        {tasks.map((task) => (
          <li key={task.id} className="group flex items-center gap-2.5">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleToggle(task)}
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                task.completed ? 'border-status-done-text bg-status-done-bg' : 'border-border hover:border-primary'
              )}
              aria-label={task.completed ? 'Označit jako nesplněné' : 'Označit jako splněné'}
            >
              {task.completed && <span className="h-2.5 w-2.5 rounded-sm bg-status-done-text" />}
            </button>
            <span className={cn('flex-1 text-sm', task.completed ? 'text-text-muted line-through' : 'text-text-primary')}>
              {task.title}
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRemove(task.id)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-muted opacity-0 hover:bg-elevated hover:text-text-primary group-hover:opacity-100"
              aria-label="Odebrat"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {tasks.length === 0 && <p className="text-sm text-text-muted">Zatím žádné práce.</p>}
      </ul>

      {error && (
        <p className="mt-3 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-xs text-status-blocked-text">
          {error}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Přidat práci..."
          className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newTitle.trim() || isPending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-text-secondary hover:bg-border disabled:opacity-40"
          aria-label="Přidat"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
