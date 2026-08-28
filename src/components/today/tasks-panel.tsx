'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Plus, ExternalLink } from 'lucide-react';
import { createTask, toggleTask } from '@/lib/actions/today.actions';
import { cn } from '@/lib/utils';

type TaskItem = {
  id: string;
  title: string;
  completed: boolean;
  job: { id: string; number: string; vehicle: { brand: string; model: string } } | null;
};

type JobOption = {
  id: string;
  number: string;
  vehicle: { brand: string; model: string };
};

export function TasksPanel({ tasks, jobs = [] }: { tasks: TaskItem[]; jobs?: JobOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [jobId, setJobId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDueDate(new Date().toISOString().slice(0, 10));
    setJobId('');
    setError(null);
    setIsAdding(false);
  };

  const handleCreate = () => {
    if (!title.trim()) {
      setError('Zadejte název úkolu.');
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await createTask({ title, dueDate, jobId: jobId || undefined });
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Úkol se nepodařilo vytvořit.');
      }
    });
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-text-primary">
          Úkoly na dnes <span className="text-text-muted">({tasks.length})</span>
        </h3>
        <button
          type="button"
          onClick={() => { setError(null); setIsAdding(true); }}
          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-primary hover:bg-elevated"
        >
          <Plus className="h-3.5 w-3.5" />
          Přidat úkol
        </button>
      </div>

      {isAdding && (
        <div className="mb-4 rounded-lg border border-border bg-elevated p-3">
          <div className="space-y-3">
            <div>
              <label htmlFor="task-title" className="mb-1 block text-xs font-medium text-text-secondary">
                Co je potřeba udělat?
              </label>
              <input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                placeholder="Např. Zavolat zákazníkovi"
                autoFocus
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="task-due-date" className="mb-1 block text-xs font-medium text-text-secondary">
                  Termín
                </label>
                <input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="task-job" className="mb-1 block text-xs font-medium text-text-secondary">
                  Zakázka
                </label>
                <select
                  id="task-job"
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                >
                  <option value="">Bez zakázky</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      #{job.number} — {job.vehicle.brand} {job.vehicle.model}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={resetForm}
                className="rounded-md border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface disabled:opacity-50"
              >
                Zrušit
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleCreate}
                className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {isPending ? 'Ukládám…' : 'Přidat úkol'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm', task.completed ? 'text-text-muted line-through' : 'text-text-primary')}>
                  {task.title}
                </p>
                {task.job && (
                  <Link
                    href={`/jobs/${task.job.id}`}
                    className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {task.job.vehicle.brand} {task.job.vehicle.model} · #{task.job.number}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
