import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  getHours,
  getMinutes,
  isSameDay,
  isSameMonth,
  isToday,
  setHours,
  setMinutes,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type { CalEvent, RecurrenceRule } from "../types";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAYS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function startOfViewWeek(date: Date, weekStartsOn: 0 | 1) {
  return startOfWeek(date, { weekStartsOn });
}

export function endOfViewWeek(date: Date, weekStartsOn: 0 | 1) {
  return endOfWeek(date, { weekStartsOn });
}

export function monthGrid(date: Date, weekStartsOn: 0 | 1, weeks = 6) {
  const start = startOfViewWeek(startOfMonth(date), weekStartsOn);
  const days = weeks * 7;
  return Array.from({ length: days }, (_, i) => addDays(start, i));
}

export function yearMonths(date: Date) {
  const start = startOfYear(date);
  return Array.from({ length: 12 }, (_, i) => addMonths(start, i));
}

export function hoursOfDay() {
  return Array.from({ length: 24 }, (_, i) => i);
}

export function toISO(d: Date) {
  return d.toISOString();
}

export function fromISO(s: string) {
  return new Date(s);
}

export function formatTime(d: Date) {
  const minutes = getMinutes(d);
  if (minutes === 0) return format(d, "h a").toLowerCase().replace(" ", "");
  return format(d, "h:mm a").toLowerCase().replace(" ", "");
}

export function formatTimeRange(start: Date, end: Date, allDay: boolean) {
  if (allDay) {
    if (isSameDay(start, end) || differenceInCalendarDays(end, start) <= 1) {
      return "All-Day";
    }
    return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
  }
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatHourLabel(hour: number) {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function eventOverlapsDay(event: CalEvent, day: Date) {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  if (event.allDay) {
    const start = startOfDay(fromISO(event.start));
    const end = startOfDay(fromISO(event.end));
    return dayStart.getTime() >= start.getTime() && dayStart.getTime() <= end.getTime();
  }
  return fromISO(event.start).getTime() <= dayEnd.getTime() && fromISO(event.end).getTime() >= dayStart.getTime();
}

export function isAllDayOn(event: CalEvent, day: Date) {
  return event.allDay && eventOverlapsDay(event, day);
}

export function minutesFromMidnight(d: Date) {
  return getHours(d) * 60 + getMinutes(d);
}

export function setTime(day: Date, hours: number, minutes: number) {
  return setMinutes(setHours(startOfDay(day), hours), minutes);
}

export function addMinutesTo(d: Date, minutes: number) {
  return new Date(d.getTime() + minutes * 60_000);
}

export function expandRecurring(
  event: CalEvent,
  rangeStart: Date,
  rangeEnd: Date,
): CalEvent[] {
  if (!event.recurrence) {
    return eventOverlapsRange(event, rangeStart, rangeEnd) ? [event] : [];
  }
  const rule = event.recurrence;
  const duration = fromISO(event.end).getTime() - fromISO(event.start).getTime();
  const seedStart = fromISO(event.start);
  const until = rule.until ? fromISO(rule.until) : rangeEnd;
  const out: CalEvent[] = [];
  let count = 0;
  const max = rule.count ?? 400;

  let cursor = seedStart;
  const safety = 2500;
  let i = 0;
  while (i++ < safety && count < max && cursor <= until && cursor <= rangeEnd) {
    if (cursor >= addDays(rangeStart, -1) && occurrenceMatches(cursor, seedStart, rule)) {
      if (cursor >= seedStart && cursor <= until) {
        const start = cursor;
        const end = new Date(start.getTime() + duration);
        if (end >= rangeStart && start <= rangeEnd) {
          out.push({
            ...event,
            id: `${event.id}::${start.toISOString()}`,
            start: start.toISOString(),
            end: end.toISOString(),
          });
          count++;
        }
      }
    }
    cursor = nextCandidate(cursor, rule);
  }
  return out;
}

function occurrenceMatches(cursor: Date, seed: Date, rule: RecurrenceRule) {
  if (rule.freq === "weekly" && rule.byWeekday?.length) {
    return rule.byWeekday.includes(getDay(cursor));
  }
  if (rule.freq === "monthly" && rule.byWeekday?.length && rule.bySetPos) {
    return (
      getDay(cursor) === rule.byWeekday[0] &&
      weekdayPositionInMonth(cursor) === rule.bySetPos
    );
  }
  if (rule.freq === "yearly") {
    const month = (rule.byMonth ?? seed.getMonth() + 1) - 1;
    const day = rule.byMonthDay ?? seed.getDate();
    return cursor.getMonth() === month && cursor.getDate() === day;
  }
  if (rule.freq === "monthly" && rule.byMonthDay) {
    return cursor.getDate() === rule.byMonthDay;
  }
  return true;
}

function nextCandidate(cursor: Date, rule: RecurrenceRule) {
  const interval = rule.interval || 1;
  if (rule.freq === "daily") return addDays(cursor, interval);
  if (rule.freq === "weekly") return addDays(cursor, 1);
  if (rule.freq === "monthly") return addDays(cursor, 1);
  return addDays(cursor, 1);
}

function weekdayPositionInMonth(d: Date) {
  const n = Math.ceil(d.getDate() / 7);
  return n;
}

function eventOverlapsRange(event: CalEvent, rangeStart: Date, rangeEnd: Date) {
  return fromISO(event.start) <= rangeEnd && fromISO(event.end) >= rangeStart;
}

export function eventsOnDay(events: CalEvent[], day: Date) {
  return events.filter((e) => eventOverlapsDay(e, day));
}

export function sameDay(a: Date, b: Date) {
  return isSameDay(a, b);
}

export function sameMonth(a: Date, b: Date) {
  return isSameMonth(a, b);
}

export function dayIsToday(d: Date) {
  return isToday(d);
}

export function labelForDay(d: Date) {
  if (isToday(d)) return "TODAY";
  if (isToday(addDays(d, -1))) return "YESTERDAY";
  if (isToday(addDays(d, 1))) return "TOMORROW";
  return format(d, "EEEE, MMMM d").toUpperCase();
}

export function shortDayLabel(d: Date) {
  return format(d, "EEE d");
}

export function monthTitle(d: Date) {
  return format(d, "MMMM yyyy");
}

export function visibleRangeForView(
  view: "day" | "week" | "month" | "quarter" | "year" | "tasks",
  date: Date,
  weekStartsOn: 0 | 1,
) {
  if (view === "day" || view === "tasks") {
    return { start: startOfDay(date), end: endOfDay(date) };
  }
  if (view === "week") {
    return {
      start: startOfViewWeek(date, weekStartsOn),
      end: endOfViewWeek(date, weekStartsOn),
    };
  }
  if (view === "month") {
    const days = monthGrid(date, weekStartsOn, 6);
    return { start: days[0], end: endOfDay(days[days.length - 1]) };
  }
  if (view === "quarter") {
    const start = startOfMonth(date);
    return { start, end: endOfMonth(addMonths(start, 2)) };
  }
  const start = startOfYear(date);
  return { start, end: addYears(start, 1) };
}

export function eachDate(start: Date, end: Date) {
  if (end < start) return [start];
  return eachDayOfInterval({ start: startOfDay(start), end: startOfDay(end) });
}

export { addDays, addMonths, addWeeks, addYears, format, getDay, startOfDay, endOfDay };
