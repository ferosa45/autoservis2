'use client';

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { formatWeekdayShort, formatTime, isSameDay } from '@/lib/format';
import { useQuickJob } from '@/components/quick-job/quick-job-provider';
import { CalendarJobCard } from './calendar-job-card';
import { CurrentTimeIndicator } from './current-time-indicator';
import { cn } from '@/lib/utils';
import type { WeekJob } from '@/lib/services/calendar.service';

type WeekJobForGrid = Omit<WeekJob, 'items'>;

export const HOUR_HEIGHT = 56;
const MIN_FREE_SLOT_MINUTES = 60;

function minutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

type FreeSlot = { startMinutes: number; endMinutes: number };

function findFreeSlots(jobs: WeekJobForGrid[], startHour: number, endHour: number): FreeSlot[] {
  const dayStartMinutes = startHour * 60;
  const dayEndMinutes = endHour * 60;

  const sorted = [...jobs].sort(
    (a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime()
  );

  const slots: FreeSlot[] = [];
  let cursor = dayStartMinutes;

  for (const job of sorted) {
    const jobStart = minutesFromMidnight(job.scheduledStart);
    const jobEnd = job.scheduledEnd ? minutesFromMidnight(job.scheduledEnd) : jobStart + 60;

    if (jobStart - cursor >= MIN_FREE_SLOT_MINUTES) {
      slots.push({ startMinutes: cursor, endMinutes: jobStart });
    }
    if (jobEnd > cursor) cursor = jobEnd;
  }

  if (dayEndMinutes - cursor >= MIN_FREE_SLOT_MINUTES) {
    slots.push({ startMinutes: cursor, endMinutes: dayEndMinutes });
  }

  return slots;
}

export function CalendarGrid({
  weekDays,
  jobs,
  startHour,
  endHour,
}: {
  weekDays: Date[];
  jobs: WeekJobForGrid[];
  startHour: number;
  endHour: number;
}) {
  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour]
  );
  const gridHeight = hours.length * HOUR_HEIGHT;

  const jobsByDay = useMemo(() => {
    return weekDays.map((day) => jobs.filter((job) => isSameDay(job.scheduledStart, day)));
  }, [weekDays, jobs]);

  const today = new Date();

  return (
    <div className="min-w-0 overflow-x-auto rounded-lg border border-border bg-surface">
      <div className="flex min-w-[840px]">
        {/* Sloupec s časovými popisky */}
        <div className="w-14 shrink-0 border-r border-border pt-9">
          {hours.map((hour) => (
            <div
              key={hour}
              style={{ height: HOUR_HEIGHT }}
              className="flex items-start justify-end pr-2 text-xs text-text-muted"
            >
              {hour}:00
            </div>
          ))}
        </div>

        {/* 7 sloupců dnů. Na mobilu mají pevnou minimální šířku a celý týden lze posouvat vodorovně. */}
        <div className="grid min-w-0 flex-1 grid-cols-7 divide-x divide-border">
          {weekDays.map((day, index) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              jobs={jobsByDay[index] ?? []}
              isToday={isSameDay(day, today)}
              startHour={startHour}
              endHour={endHour}
              gridHeight={gridHeight}
              hours={hours}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayColumn({
  day,
  jobs,
  isToday,
  startHour,
  endHour,
  gridHeight,
  hours,
}: {
  day: Date;
  jobs: WeekJobForGrid[];
  isToday: boolean;
  startHour: number;
  endHour: number;
  gridHeight: number;
  hours: number[];
}) {
  const { openQuickJob } = useQuickJob();
  const freeSlots = useMemo(() => findFreeSlots(jobs, startHour, endHour), [jobs, startHour, endHour]);

  function timeFromMinutes(totalMinutes: number): Date {
    const d = new Date(day);
    d.setHours(0, totalMinutes, 0, 0);
    return d;
  }

  function handleColumnClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const rawMinutes = (offsetY / HOUR_HEIGHT) * 60;
    const roundedMinutes = Math.round(rawMinutes / 30) * 30;
    const startTotalMinutes = startHour * 60 + roundedMinutes;
    const endTotalMinutes = Math.min(startTotalMinutes + 60, endHour * 60);

    openQuickJob({
      scheduledStart: timeFromMinutes(startTotalMinutes),
      scheduledEnd: timeFromMinutes(endTotalMinutes),
    });
  }

  return (
    <div className="flex min-w-[112px] flex-col">
      <div
        className={cn(
          'flex flex-col items-center gap-0.5 border-b border-border py-2',
          isToday && 'bg-primary-muted'
        )}
      >
        <span className="text-[11px] font-medium uppercase text-text-muted">{formatWeekdayShort(day)}</span>
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold',
            isToday ? 'bg-primary text-white' : 'text-text-primary'
          )}
        >
          {day.getDate()}
        </span>
      </div>

      <div onClick={handleColumnClick} style={{ height: gridHeight }} className="relative cursor-pointer">
        {hours.map((hour, i) => (
          <div
            key={hour}
            style={{ top: i * HOUR_HEIGHT }}
            className="absolute left-0 right-0 border-t border-border/60"
          />
        ))}

        {freeSlots.map((slot) => {
          const top = ((slot.startMinutes - startHour * 60) / 60) * HOUR_HEIGHT;
          const height = ((slot.endMinutes - slot.startMinutes) / 60) * HOUR_HEIGHT;
          return (
            <button
              key={slot.startMinutes}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const endMinutes = Math.min(slot.startMinutes + 60, slot.endMinutes);
                openQuickJob({
                  scheduledStart: timeFromMinutes(slot.startMinutes),
                  scheduledEnd: timeFromMinutes(endMinutes),
                });
              }}
              style={{ top, height }}
              className="absolute left-1 right-1 flex items-center justify-between rounded-md border border-dashed border-border/80 bg-elevated/40 px-2 text-left text-text-muted transition-colors hover:border-primary/40 hover:text-text-secondary"
            >
              <span className="truncate text-[10px]">{formatTime(timeFromMinutes(slot.startMinutes))}</span>
              <Plus className="h-3 w-3 shrink-0" />
            </button>
          );
        })}

        {jobs.map((job) => {
          const startMinutes = minutesFromMidnight(job.scheduledStart) - startHour * 60;
          const endMinutes = job.scheduledEnd
            ? minutesFromMidnight(job.scheduledEnd) - startHour * 60
            : startMinutes + 60;
          const top = (Math.max(startMinutes, 0) / 60) * HOUR_HEIGHT;
          const height = (Math.max(endMinutes - startMinutes, 30) / 60) * HOUR_HEIGHT;

          return <CalendarJobCard key={job.id} job={job} top={top} height={height} />;
        })}

        {isToday && <CurrentTimeIndicator startHour={startHour} endHour={endHour} />}
      </div>
    </div>
  );
}
