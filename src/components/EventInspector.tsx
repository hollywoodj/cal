import { format } from "date-fns";
import { useCal } from "../state/store";
import { fromISO } from "../lib/dates";

export function EventInspector() {
  const inspector = useCal((s) => s.inspector);
  const events = useCal((s) => s.events);
  const calendars = useCal((s) => s.calendars);
  const updateEvent = useCal((s) => s.updateEvent);
  const deleteEvent = useCal((s) => s.deleteEvent);
  const duplicateEvent = useCal((s) => s.duplicateEvent);
  const saveTemplate = useCal((s) => s.saveTemplate);
  const openInspector = useCal((s) => s.openInspector);
  if (!inspector.eventId) return null;
  const rootId = inspector.eventId.split("::")[0];
  const event = events.find((e) => e.id === rootId) ?? events.find((e) => e.id === inspector.eventId);
  if (!event) return null;
  const start = fromISO(event.start);
  const end = fromISO(event.end);
  const cal = calendars.find((c) => c.id === event.calendarId);
  const locked = event.source.startsWith("smart:");

  function setDateTime(which: "start" | "end", value: string) {
    const d = new Date(value);
    updateEvent(event!.id, { [which]: d.toISOString() });
  }

  return (
    <aside className="inspector popover">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Event</h3>
        <button className="ghost" onClick={() => openInspector(null)}>
          Close
        </button>
      </div>
      <div className="field">
        Title
        <input
          value={event.title}
          disabled={locked}
          onChange={(e) => updateEvent(event.id, { title: e.target.value })}
        />
      </div>
      <div className="field">
        Calendar
        <select
          value={event.calendarId}
          disabled={locked}
          onChange={(e) => updateEvent(event.id, { calendarId: e.target.value })}
        >
          {calendars.filter((c) => c.writable || c.id === event.calendarId).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={event.allDay}
          disabled={locked}
          onChange={(e) => updateEvent(event.id, { allDay: e.target.checked })}
        />
        All-day
      </label>
      <div className="field">
        Starts
        <input
          type="datetime-local"
          disabled={locked}
          value={toLocal(start)}
          onChange={(e) => setDateTime("start", e.target.value)}
        />
      </div>
      <div className="field">
        Ends
        <input
          type="datetime-local"
          disabled={locked}
          value={toLocal(end)}
          onChange={(e) => setDateTime("end", e.target.value)}
        />
      </div>
      <div className="field">
        Location
        <input
          value={event.location ?? ""}
          disabled={locked}
          onChange={(e) => updateEvent(event.id, { location: e.target.value })}
        />
      </div>
      <div className="field">
        Invitees
        <input
          value={event.invitees.join(", ")}
          disabled={locked}
          onChange={(e) =>
            updateEvent(event.id, {
              invitees: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            })
          }
        />
      </div>
      <div className="field">
        Alert
        <select
          value={event.alertMinutes ?? ""}
          disabled={locked}
          onChange={(e) =>
            updateEvent(event.id, { alertMinutes: e.target.value ? Number(e.target.value) : undefined })
          }
        >
          <option value="">None</option>
          <option value="0">At time of event</option>
          <option value="5">5 minutes before</option>
          <option value="15">15 minutes before</option>
          <option value="30">30 minutes before</option>
          <option value="60">1 hour before</option>
          <option value="1440">1 day before</option>
        </select>
      </div>
      <div className="field">
        URL
        <input
          value={event.url ?? ""}
          disabled={locked}
          onChange={(e) => updateEvent(event.id, { url: e.target.value })}
        />
      </div>
      <div className="field">
        Notes
        <textarea
          rows={4}
          value={event.notes ?? ""}
          disabled={locked}
          onChange={(e) => updateEvent(event.id, { notes: e.target.value })}
        />
      </div>
      {event.conference && (
        <a href={event.conference} target="_blank" rel="noreferrer" className="primary" style={{ textDecoration: "none", justifyContent: "center" }}>
          Join conference
        </a>
      )}
      {event.url && !event.conference && (
        <a href={event.url} target="_blank" rel="noreferrer" className="ghost">
          Open link
        </a>
      )}
      <div style={{ fontSize: 11, color: "var(--main-muted)", marginTop: 8 }}>
        {cal?.name} · {event.source.startsWith("smart:") ? "Smart calendar" : "Local"} · {format(start, "EEE p")}
      </div>
      <div className="inspector-actions">
        {!locked && (
          <>
            <button className="ghost" onClick={() => saveTemplate(event.id)}>
              Template
            </button>
            <button className="ghost" onClick={() => duplicateEvent(event.id)}>
              Duplicate
            </button>
            <button className="ghost" style={{ color: "var(--red)" }} onClick={() => deleteEvent(event.id)}>
              Delete
            </button>
          </>
        )}
        {locked && <span style={{ fontSize: 12, color: "var(--main-muted)" }}>Managed by a smart calendar</span>}
      </div>
    </aside>
  );
}

function toLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
