import { WorkshopJobCard } from './workshop-job-card';
import type { JobForDay } from '@/lib/services/today.service';

export function WorkshopJobList({
  jobs,
  selectedJobId,
  dateParam,
}: {
  jobs: JobForDay[];
  selectedJobId: string | null;
  dateParam: string | undefined;
}) {
  if (jobs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center text-text-muted">
        <p className="text-lg">Na tento den nejsou naplánované žádné zakázky.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-4">
      {jobs.map((job) => (
        <WorkshopJobCard key={job.id} job={job} isSelected={job.id === selectedJobId} dateParam={dateParam} />
      ))}
    </div>
  );
}
