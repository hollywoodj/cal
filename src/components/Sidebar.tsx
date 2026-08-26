import { addMonths, format, isSameDay, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCal, useVisibleEvents } from "../state/store";
import { eventsOnDay, formatTime, fromISO, labelForDay, monthGrid, WEEKDAYS } from "../lib/dates";
import type { CalEvent, TaskItem } from "../types";

export function Sidebar() {
  const open = useCal((s) => s.sidebarOpen);
  if (!open) return <aside className="sidebar collapsed" />;
  return (
    <aside className="sidebar">
      <MiniCalendar />
      <ContextBanner />
      <UpcomingList />
      <CalendarFoot />
    </aside>
  );
}

function MiniCalendar() {
  const selected = useCal((s) => s.selectedDateObj());
  const setSelectedDate = useCal((s) => s.setSelectedDate);
  const settings = useCal((s) => s.settings);
  const events = useVisibleEvents();
  const calendars = useCal((s) => s.calendars);
  const [month, setMonth] = useState(() => new Date(selected));

  useEffect(() => {
    if (selected.getMonth() !== month.getMonth() || selected.getFullYear() !== month.getFullYear()) {
      setMonth(new Date(selected));
    }
  }, [selected, month]);

  const days = monthGrid(month, settings.weekStartsOn, 6);
  const dows = Array.from({ length: 7 }, (_, i) => WEEKDAYS[(i + settings.weekStartsOn) % 7].slice(0, 1));

  return (
    <div className="mini-cal">
      <div className="mini-cal-head">
        <strong>{format(month, "MMMM yyyy")}</strong>
        <div>
          <button className="icon-btn" onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <button className="icon-btn" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="mini-grid">
        {dows.map((d) => (
          <div key={d} className="mini-dow">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const list = eventsOnDay(events, day);
          const colors = [...new Set(list.map((e) => calendars.find((c) => c.id === e.calendarId)?.color).filter(Boolean))] as string[];
          return (
            <button
              key={day.toISOString()}
              className={`mini-day ${isSameMonth(day, month) ? "" : "out"} ${isSameDay(day, selected) ? "selected" : ""} ${isSameDay(day, new Date()) ? "today" : ""}`}
              onClick={() => {
                setSelectedDate(day);
                setMonth(day);
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

function ContextBanner() {
  const hint = useCal((s) => s.contextHint());
  if (!hint) return null;
  return <div className="context-banner">{hint}</div>;
}

function UpcomingList() {
  const selected = useCal((s) => s.selectedDateObj());
  const events = useVisibleEvents();
  const tasks = useCal((s) => s.tasks);
  const calendars = useCal((s) => s.calendars);
  const openInspector = useCal((s) => s.openInspector);
  const toggleTask = useCal((s) => s.toggleTask);
  const selectedEventId = useCal((s) => s.selectedEventId);

  const groups = useMemo(() => {
    const days = Array.from({ length: 10 }, (_, i) => {
      const d = new Date(selected);
      d.setDate(d.getDate() + i);
      return d;
    });
    return days
      .map((day) => ({
        day,
        events: eventsOnDay(events, day).sort(
          (a, b) => Number(b.allDay) - Number(a.allDay) || fromISO(a.start).getTime() - fromISO(b.start).getTime(),
        ),
        tasks: tasks.filter((t) => t.due && isSameDay(fromISO(t.due), day) && !t.completed),
      }))
      .filter((g) => g.events.length || g.tasks.length);
  }, [events, selected, tasks]);

  return (
    <div className="event-list">
      {groups.length === 0 && <div className="empty">No upcoming events in this set.</div>}
      {groups.map((g) => (
        <div key={g.day.toISOString()}>
          <h3>{labelForDay(g.day)}</h3>
          {g.tasks.map((t) => (
            <SideTask key={t.id} task={t} onToggle={() => toggleTask(t.id)} />
          ))}
          {g.events.map((e) => (
            <SideEvent
              key={e.id}
              event={e}
              color={calendars.find((c) => c.id === e.calendarId)?.color ?? "#007AFF"}
              active={selectedEventId === e.id}
              onClick={() => openInspector(e.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function SideEvent({
  event,
  color,
  active,
  onClick,
}: {
  event: CalEvent;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  const start = fromISO(event.start);
  return (
    <button className={`side-event ${active ? "active" : ""}`} onClick={onClick}>
      <span className="when">{event.allDay ? "All-Day" : formatTime(start)}</span>
      <span className="bar" style={{ background: color }} />
      <span className="meta">
        <strong>{event.title}</strong>
        {event.location && <span>{event.location}</span>}
      </span>
    </button>
  );
}

function SideTask({ task, onToggle }: { task: TaskItem; onToggle: () => void }) {
  return (
    <div className={`side-task ${task.completed ? "done" : ""}`}>
      <button className="check" onClick={onToggle} />
      <div className="ttl">
        {task.priority > 0 && <span className="prio">{"!".repeat(task.priority)}</span>}
        {task.title}
      </div>
    </div>
  );
}

function CalendarFoot() {
  const sets = useCal((s) => s.sets);
  const activeSetId = useCal((s) => s.activeSetId);
  const setActiveSet = useCal((s) => s.setActiveSet);
  const calendars = useCal((s) => s.calendars);
  const toggleCalendar = useCal((s) => s.toggleCalendar);
  const setCatalogOpen = useCal((s) => s.setCatalogOpen);
  const [menu, setMenu] = useState(false);
  const [cals, setCals] = useState(true);
  const active = sets.find((s) => s.id === activeSetId);
  const allowed = new Set(active?.calendarIds ?? calendars.map((c) => c.id));
  const shown = calendars.filter((c) => allowed.has(c.id));
  const grouped = groupBy(shown, (c) => c.account);

  return (
    <div className="cal-foot" style={{ position: "relative" }}>
      {cals &&
        Object.entries(grouped).map(([account, list]) => (
          <div key={account}>
            <div className="account-label">{account}</div>
            {list.map((c) => (
              <button
                key={c.id}
                className={`cal-row ${c.visible ? "" : "off"}`}
                onClick={() => toggleCalendar(c.id)}
              >
                <span className="cal-check" style={{ background: c.visible ? c.color : "transparent", borderColor: c.color }} />
                <span className="name">{c.name}</span>
                {c.kind === "smart" && <span className="kbd">SMART</span>}
              </button>
            ))}
          </div>
        ))}
      <button className="cal-row" onClick={() => setCatalogOpen(true)}>
        <span className="name">Add Smart Calendar…</span>
      </button>
      <button className="set-btn" onClick={() => setMenu((v) => !v)}>
        <span>{active?.name ?? "Calendar Set"}</span>
        <ChevronsUpDown size={14} />
      </button>
      {menu && (
        <div className="set-menu">
          {sets.map((s, i) => (
            <button
              key={s.id}
              className={s.id === activeSetId ? "on" : ""}
              onClick={() => {
                setActiveSet(s.id);
                setMenu(false);
              }}
            >
              {s.name}
              <span style={{ float: "right", opacity: 0.45 }} className="kbd">
                ^{i + 1}
              </span>
            </button>
          ))}
          <button
            onClick={() => {
              setCals((v) => !v);
              setMenu(false);
            }}
          >
            {cals ? "Hide calendars" : "Show calendars"}
          </button>
        </div>
      )}
    </div>
  );
}

function groupBy<T>(arr: T[], fn: (t: T) => string) {
  const o: Record<string, T[]> = {};
  for (const x of arr) {
    const k = fn(x);
    (o[k] ??= []).push(x);
  }
  return o;
}
