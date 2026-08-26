import { addMonths, format, isSameDay, isSameMonth } from "date-fns";
import { useCal, useVisibleEvents } from "../state/store";
import { contrastText } from "../lib/colors";
import { eventsOnDay, formatTime, fromISO, monthGrid, WEEKDAYS } from "../lib/dates";
import type { CalEvent } from "../types";

export function MonthView() {
  const date = useCal((s) => s.selectedDateObj());
  const settings = useCal((s) => s.settings);
  const events = useVisibleEvents();
  const calendars = useCal((s) => s.calendars);
  const selected = date;
  const setSelectedDate = useCal((s) => s.setSelectedDate);
  const openInspector = useCal((s) => s.openInspector);
  const openParser = useCal((s) => s.openParser);
  const days = monthGrid(date, settings.weekStartsOn, settings.monthWeeks);
  const dows = Array.from({ length: 7 }, (_, i) => WEEKDAYS[(i + settings.weekStartsOn) % 7]);

  return (
    <div className="month-grid">
      <div className="month-dows">
        {dows.map((d) => (
          <span key={d}>{d.toUpperCase()}</span>
        ))}
      </div>
      <div className="month-cells">
        {days.map((day) => {
          const list = eventsOnDay(events, day)
            .slice()
            .sort((a, b) => Number(b.allDay) - Number(a.allDay) || fromISO(a.start).getTime() - fromISO(b.start).getTime());
          const shown = list.slice(0, 3);
          const extra = list.length - shown.length;
          return (
            <div
              key={day.toISOString()}
              className={`mcell ${isSameMonth(day, date) ? "" : "out"} ${isSameDay(day, new Date()) ? "today" : ""} ${isSameDay(day, selected) ? "selected" : ""}`}
              onClick={() => setSelectedDate(day)}
              onDoubleClick={() => {
                setSelectedDate(day);
                openParser(`${format(day, "MMMM d")} `);
              }}
            >
              <div className="num">{format(day, "d")}</div>
              {shown.map((e) => (
                <MonthPill key={e.id} event={e} color={calendars.find((c) => c.id === e.calendarId)?.color ?? "#007AFF"} onOpen={() => openInspector(e.id)} />
              ))}
              {extra > 0 && <div className="more">+{extra} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthPill({ event, color, onOpen }: { event: CalEvent; color: string; onOpen: () => void }) {
  return (
    <div
      className="pill"
      style={{ background: color, color: contrastText(color) }}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
    >
      {event.allDay ? event.title : `${formatTime(fromISO(event.start))} ${event.title}`}
    </div>
  );
}

export function QuarterView() {
  const date = useCal((s) => s.selectedDateObj());
  const months = [date, addMonths(date, 1), addMonths(date, 2)];
  return (
    <div className="quarter-grid">
      {months.map((m) => (
        <MiniMonth key={m.toISOString()} month={m} />
      ))}
    </div>
  );
}

export function YearView() {
  const date = useCal((s) => s.selectedDateObj());
  const months = Array.from({ length: 12 }, (_, i) => new Date(date.getFullYear(), i, 1));
  return (
    <div className="year-grid">
      {months.map((m) => (
        <MiniMonth key={m.toISOString()} month={m} />
      ))}
    </div>
  );
}

function MiniMonth({ month }: { month: Date }) {
  const settings = useCal((s) => s.settings);
  const events = useVisibleEvents();
  const setSelectedDate = useCal((s) => s.setSelectedDate);
  const setView = useCal((s) => s.setView);
  const days = monthGrid(month, settings.weekStartsOn, 6);
  const dows = Array.from({ length: 7 }, (_, i) => WEEKDAYS[(i + settings.weekStartsOn) % 7].slice(0, 1));
  const calendars = useCal((s) => s.calendars);

  return (
    <div className="mini-month">
      <h4>{format(month, "MMMM")}</h4>
      <div className="mini-grid">
        {dows.map((d) => (
          <div key={d} className="mini-dow" style={{ color: "var(--main-muted)" }}>
            {d}
          </div>
        ))}
        {days.map((day) => {
          const list = eventsOnDay(events, day);
          const colors = [...new Set(list.map((e) => calendars.find((c) => c.id === e.calendarId)?.color).filter(Boolean))] as string[];
          return (
            <button
              key={day.toISOString()}
              className={`mini-day ${isSameMonth(day, month) ? "" : "out"} ${isSameDay(day, new Date()) ? "today" : ""}`}
              style={{ color: isSameMonth(day, month) ? "var(--main-text)" : undefined }}
              onClick={() => {
                setSelectedDate(day);
                setView("day");
              }}
            >
              {format(day, "d")}
              <span className="mini-dots">
                {colors.slice(0, 3).map((c) => (
                  <b key={c} style={{ background: c }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
