import { addDays } from "date-fns";
import { useCal } from "../state/store";
import { startOfViewWeek } from "../lib/dates";
import { TimeGrid } from "./TimeGrid";

export function WeekView() {
  const date = useCal((s) => s.selectedDateObj());
  const settings = useCal((s) => s.settings);
  const start = startOfViewWeek(date, settings.weekStartsOn);
  const days = Array.from({ length: settings.weekViewDays }, (_, i) => addDays(start, i));
  if (settings.weekViewDays === 5) {
    const mondayStart = settings.weekStartsOn === 1 ? start : addDays(start, 1);
    const work = Array.from({ length: 5 }, (_, i) => addDays(mondayStart, i));
    return <TimeGrid days={work} hourHeight={settings.hourHeight} />;
  }
  return <TimeGrid days={days} hourHeight={settings.hourHeight} />;
}

export function DayView() {
  const date = useCal((s) => s.selectedDateObj());
  const settings = useCal((s) => s.settings);
  return <TimeGrid days={[date]} hourHeight={settings.hourHeight} />;
}
