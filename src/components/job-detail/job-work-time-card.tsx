import { Clock, User } from 'lucide-react';

type WorkSession = {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  user: { name: string };
};

function formatDuration(totalSeconds: number) {
  const minutes = Math.max(0, Math.floor(totalSeconds / 60));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours} h ${mins} min` : `${mins} min`;
}

function sessionSeconds(session: WorkSession, now: number) {
  const end = session.endedAt?.getTime() ?? now;
  return Math.max(0, Math.floor((end - session.startedAt.getTime()) / 1000));
}

export function JobWorkTimeCard({ sessions }: { sessions: WorkSession[] }) {
  const now = Date.now();
  const totalSeconds = sessions.reduce((sum, session) => sum + sessionSeconds(session, now), 0);

  const byMechanic = sessions.reduce<Map<string, { name: string; seconds: number }>>((map, session) => {
    const current = map.get(session.user.name) ?? { name: session.user.name, seconds: 0 };
    current.seconds += sessionSeconds(session, now);
    map.set(session.user.name, current);
    return map;
  }, new Map());

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Čas práce</h3>
        </div>
        <span className="text-lg font-semibold text-text-primary">{formatDuration(totalSeconds)}</span>
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-text-muted">Na zakázce zatím nebyla zaznamenána práce.</p>
      ) : (
        <div className="space-y-2">
          {Array.from(byMechanic.values()).map((mechanic) => (
            <div key={mechanic.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-text-secondary">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{mechanic.name}</span>
              </span>
              <span className="shrink-0 font-medium text-text-primary">{formatDuration(mechanic.seconds)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
