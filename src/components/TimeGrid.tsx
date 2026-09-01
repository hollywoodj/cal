import { useEffect, useMemo, useRef, useState } from "react";
import { format, isSameDay, isWeekend } from "date-fns";
import type { CalEvent } from "../types";
import { contrastText } from "../lib/colors";
import { formatHourLabel, fromISO, hoursOfDay, minutesFromMidnight, eventOverlapsDay } from "../lib/dates";
import { layoutDayEvents } from "../lib/layout";
import { useCal, useVisibleEvents } from "../state/store";

interface Props {
  days: Date[];
  hourHeight: number;
}

export function TimeGrid({ days, hourHeight }: Props) {
  const events = useVisibleEvents();
  const calendars = useCal((s) => s.calendars);
  const selectedEventId = useCal((s) => s.selectedEventId);
  const openInspector = useCal((s) => s.openInspector);
  const openParser = useCal((s) => s.openParser);
  const setSelectedDate = useCal((s) => s.setSelectedDate);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ day: Date; startMin: number; endMin: number } | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [drag, setDrag] = useState<{ day: Date; startMin: number; endMin: number } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const target = Math.max(0, 7 * hourHeight - 40);
    el.scrollTop = target;
  }, [hourHeight, days[0]?.toDateString()]);

  const calColor = (id: string) => calendars.find((c) => c.id === id)?.color ?? "#007AFF";

  const allDayByDay = useMemo(() => {
    return days.map((day) => events.filter((e) => e.allDay && eventOverlapsDay(e, day)));
  }, [days, events]);

  const timedByDay = useMemo(() => {
    return days.map((day) => {
      const list = events.filter((e) => !e.allDay && isSameDay(fromISO(e.start), day));
      return layoutDayEvents(list, hourHeight);
    });
  }, [days, events, hourHeight]);

  function minutesFromEvent(e: { clientY: number }, colEl: HTMLElement) {
    const rect = colEl.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const raw = (y / hourHeight) * 60;
    return Math.max(0, Math.min(24 * 60 - 15, Math.round(raw / 15) * 15));
  }

  function onDown(day: Date, e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest(".ev")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const startMin = minutesFromEvent(e, e.currentTarget);
    const next = { day, startMin, endMin: startMin + 60 };
    dragRef.current = next;
    setDrag(next);
    setSelectedDate(day);
  }

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const mins = minutesFromEvent(e, e.currentTarget);
    const next = {
      ...dragRef.current,
      endMin: Math.max(dragRef.current.startMin + 15, mins),
    };
    dragRef.current = next;
    setDrag(next);
  }

  function onUp() {
    const current = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!current) return;
    const s = new Date(current.day);
    s.setHours(0, 0, 0, 0);
    s.setMinutes(Math.min(current.startMin, current.endMin));
    const en = new Date(current.day);
    en.setHours(0, 0, 0, 0);
    en.setMinutes(Math.max(current.startMin, current.endMin));
    const label = `${format(s, "h:mmaaa").toLowerCase()}-${format(en, "h:mmaaa").toLowerCase()}`;
    openParser(`${format(s, "EEEE")} ${label} `);
  }

  const cols = days.length;
  const nowTop = (minutesFromMidnight(now) / 60) * hourHeight;
  const showNow = days.some((d) => isSameDay(d, now));

  return (
    <div className="time-grid-wrap">
      <div className="day-head" style={{ gridTemplateColumns: `68px repeat(${cols}, 1fr)` }}>
        <div />
        {days.map((d) => (
          <div
            key={d.toISOString()}
            className={`day-head-cell ${isSameDay(d, now) ? "today" : ""}`}
            onClick={() => setSelectedDate(d)}
          >
            {format(d, "EEE").toUpperCase()}
            <b>{format(d, "d")}</b>
          </div>
        ))}
      </div>
      <div
        className="allday"
        style={{ gridTemplateColumns: `68px repeat(${cols}, 1fr)` }}
      >
        <div style={{ fontSize: 10, color: "var(--main-muted)", padding: "8px 6px", textAlign: "right" }}>
          ALL-DAY
        </div>
        {allDayByDay.map((list, i) => (
          <div key={days[i].toISOString()}>
            {list.map((e) => (
              <div
                key={e.id}
                className="allday-ev"
                style={{ background: calColor(e.calendarId), color: contrastText(calColor(e.calendarId)) }}
                onClick={() => openInspector(e.id)}
              >
                {e.title}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="grid-scroll" ref={wrapRef}>
        <div className="hours" style={{ height: 24 * hourHeight, position: "relative" }}>
          {hoursOfDay().map((h) => (
            <div key={h} className="hour-row" style={{ height: hourHeight }}>
              <span className="label">{formatHourLabel(h)}</span>
            </div>
          ))}
          {showNow && <div className="now-line" style={{ top: nowTop }} />}
          <div className="cols" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {days.map((day, i) => (
              <div
                key={day.toISOString()}
                className={`day-col ${isWeekend(day) ? "weekend" : ""} ${isSameDay(day, now) ? "today-col" : ""}`}
                onPointerDown={(e) => onDown(day, e)}
                onPointerMove={onMove}
                onPointerUp={onUp}
              >
                {timedByDay[i].map((laid) => {
                  const color = calColor(laid.event.calendarId);
                  const left = (laid.col / laid.cols) * 100;
                  const width = 100 / laid.cols;
                  return (
                    <EventBlock
                      key={laid.event.id}
                      event={laid.event}
                      color={color}
                      top={laid.top}
                      height={laid.height}
                      left={left}
                      width={width}
                      selected={selectedEventId === laid.event.id}
                      onClick={() => openInspector(laid.event.id)}
                    />
                  );
                })}
                {drag && isSameDay(drag.day, day) && (
                  <div
                    className="ev"
                    style={{
                      top: (Math.min(drag.startMin, drag.endMin) / 60) * hourHeight,
                      height: (Math.abs(drag.endMin - drag.startMin) / 60) * hourHeight,
                      left: 4,
                      right: 4,
                      background: "rgba(0,122,255,0.25)",
                      color: "#007aff",
                    }}
                  >
                    New Event
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventBlock({
  event,
  color,
  top,
  height,
  left,
  width,
  selected,
  onClick,
}: {
  event: CalEvent;
  color: string;
  top: number;
  height: number;
  left: number;
  width: number;
  selected: boolean;
  onClick: () => void;
}) {
  const start = fromISO(event.start);
  const end = fromISO(event.end);
  return (
    <div
      className={`ev ${selected ? "selected" : ""}`}
      style={{
        top,
        height,
        left: `calc(${left}% + 2px)`,
        width: `calc(${width}% - 4px)`,
        background: color,
        color: contrastText(color),
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <strong>{event.title}</strong>
      {height > 28 && (
        <em>
          {format(start, "h:mm")}–{format(end, "h:mm a")}
          {event.location ? ` · ${event.location}` : ""}
        </em>
      )}
    </div>
  );
}
