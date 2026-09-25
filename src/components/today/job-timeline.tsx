import { TZDate } from '@date-fns/tz';
import { APP_TIME_ZONE, getPragueDateParts } from '@/lib/date-time';
import { JobCard } from './job-card';
import { FreeSlotCard } from './free-slot-card';
import type { JobForDay } from '@/lib/services/today.service';

const WORKDAY_START_HOUR = 6; // Pracovní den začíná v 6:00.
const WORKDAY_END_HOUR = 18;
const MIN_FREE_SLOT_MINUTES = 60;

type TimelineEntry =
  | { type: 'job'; job: JobForDay; time: Date }
  | { type: 'free'; time: Date; endTime: Date };

function buildTimeline(jobs: JobForDay[], date: Date): TimelineEntry[] {
  const { year, month, day } = getPragueDateParts(date);
  const dayStart = new TZDate(year, month, day, WORKDAY_START_HOUR, 0, 0, 0, APP_TIME_ZONE);
  const dayEnd = new TZDate(year, month, day, WORKDAY_END_HOUR, 0, 0, 0, APP_TIME_ZONE);

  const sorted = [...jobs].sort(
    (a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime()
  );

  const entries: TimelineEntry[] = [];
  let cursor: Date = dayStart;

  for (const job of sorted) {
    const gapMinutes = (job.scheduledStart.getTime() - cursor.getTime()) / 60000;
    if (gapMinutes >= MIN_FREE_SLOT_MINUTES) {
      entries.push({ type: 'free', time: cursor, endTime: job.scheduledStart });
    }
    entries.push({ type: 'job', job, time: job.scheduledStart });
    const jobEnd = job.scheduledEnd ?? job.scheduledStart;
    if (jobEnd.getTime() > cursor.getTime()) {
      cursor = jobEnd;
    }
  }

  const remainingMinutes = (dayEnd.getTime() - cursor.getTime()) / 60000;
  if (remainingMinutes >= MIN_FREE_SLOT_MINUTES) {
    entries.push({ type: 'free', time: cursor, endTime: dayEnd });
  }

  return entries;
}

export function JobTimeline({
  jobs,
  date,
  selectedJobId,
}: {
  jobs: JobForDay[];
  date: Date;
  selectedJobId: string | null;
}) {
  const timeline = buildTimeline(jobs, date);

  if (timeline.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-text-muted">
        Na dnešní den nejsou naplánované žádné zakázky.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {timeline.map((entry, index) =>
        entry.type === 'job' ? (
          <JobCard key={entry.job.id} job={entry.job} isSelected={entry.job.id === selectedJobId} />
        ) : (
          <FreeSlotCard
            key={`free-${index}`}
            time={new Date(entry.time.getTime())}
            endTime={new Date(entry.endTime.getTime())}
          />
        )
      )}
    </div>
  );
}
