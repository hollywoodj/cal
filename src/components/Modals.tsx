import { SMART_CALENDARS } from "../calendars/smart/registry";
import { useCal } from "../state/store";
import { nextUfcEvent } from "../calendars/smart/ufc";

export function SmartCatalog() {
  const open = useCal((s) => s.catalogOpen);
  const setCatalogOpen = useCal((s) => s.setCatalogOpen);
  const enableSmartCalendar = useCal((s) => s.enableSmartCalendar);
  const disableSmartCalendar = useCal((s) => s.disableSmartCalendar);
  const isSmartEnabled = useCal((s) => s.isSmartEnabled);
  if (!open) return null;
  const next = nextUfcEvent();

  return (
    <div className="modal-back" onClick={() => setCatalogOpen(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Smart Calendars</h2>
        <p className="sub">
          Subscribe to context-aware schedules. They populate events automatically and surface hints when the day matches — UFC fight nights, holidays, and more.
        </p>
        <div className="catalog-grid">
          {SMART_CALENDARS.map((s) => {
            const on = isSmartEnabled(s.id);
            return (
              <button
                key={s.id}
                className={`smart-card ${s.featured ? "featured" : ""}`}
                onClick={() => (on ? disableSmartCalendar(s.id) : enableSmartCalendar(s.id))}
              >
                <div className="sub2">{s.category}</div>
                <h3>
                  {s.name} {on ? "· On" : ""}
                </h3>
                <p>{s.description}</p>
                {s.id === "ufc" && next && (
                  <p className="sub2" style={{ marginTop: 10, textTransform: "none", letterSpacing: 0 }}>
                    Next: {next.title} · {new Date(next.start).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <button className="primary" onClick={() => setCatalogOpen(false)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal() {
  const open = useCal((s) => s.settingsOpen);
  const setSettingsOpen = useCal((s) => s.setSettingsOpen);
  const settings = useCal((s) => s.settings);
  const patchSettings = useCal((s) => s.patchSettings);
  const resetDemo = useCal((s) => s.resetDemo);
  if (!open) return null;

  return (
    <div className="modal-back" onClick={() => setSettingsOpen(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
        <h2>Settings</h2>
        <p className="sub">Match Fantastical’s appearance and calendar views.</p>

        <div className="field">
          Appearance
          <select
            value={settings.appearance}
            onChange={(e) => patchSettings({ appearance: e.target.value as typeof settings.appearance })}
          >
            <option value="fantastical">Fantastical (dark sidebar, light calendar)</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className="field">
          Start week on
          <select
            value={settings.weekStartsOn}
            onChange={(e) => patchSettings({ weekStartsOn: Number(e.target.value) as 0 | 1 })}
          >
            <option value={0}>Sunday</option>
            <option value={1}>Monday</option>
          </select>
        </div>
        <div className="field">
          Days in week view
          <select
            value={settings.weekViewDays}
            onChange={(e) => patchSettings({ weekViewDays: Number(e.target.value) as 5 | 7 })}
          >
            <option value={7}>7 days</option>
            <option value={5}>5 days (work week)</option>
          </select>
        </div>
        <div className="field">
          Default event duration (minutes)
          <input
            type="number"
            value={settings.defaultDurationMinutes}
            onChange={(e) => patchSettings({ defaultDurationMinutes: Number(e.target.value) })}
          />
        </div>
        <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={settings.showWeekNumbers}
            onChange={(e) => patchSettings({ showWeekNumbers: e.target.checked })}
          />
          Show calendar week numbers
        </label>
        <div className="inspector-actions">
          <button className="ghost" onClick={resetDemo}>
            Reset demo data
          </button>
          <button className="primary" onClick={() => setSettingsOpen(false)}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function SearchModal() {
  const open = useCal((s) => s.searchOpen);
  const setSearchOpen = useCal((s) => s.setSearchOpen);
  const query = useCal((s) => s.searchQuery);
  const setSearch = useCal((s) => s.setSearch);
  const events = useCal((s) => s.events);
  const tasks = useCal((s) => s.tasks);
  const openInspector = useCal((s) => s.openInspector);
  const setSelectedDate = useCal((s) => s.setSelectedDate);
  if (!open) return null;
  const q = query.trim().toLowerCase();
  const hits = q
    ? events.filter((e) =>
        [e.title, e.location, e.notes, e.invitees.join(" ")].filter(Boolean).join(" ").toLowerCase().includes(q),
      ).slice(0, 30)
    : events.slice(0, 12);
  const taskHits = q ? tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 10) : [];

  return (
    <div className="modal-back" onClick={() => setSearchOpen(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ width: 520 }}>
        <input
          autoFocus
          placeholder="Search events and tasks"
          value={query}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            fontSize: 18,
            border: 0,
            borderBottom: "1px solid var(--main-hair)",
            padding: "8px 4px 12px",
            background: "transparent",
            color: "inherit",
            outline: "none",
          }}
        />
        <div className="search-list" style={{ marginTop: 10 }}>
          {hits.map((e) => (
            <button
              key={e.id}
              onClick={() => {
                setSelectedDate(new Date(e.start));
                openInspector(e.id);
                setSearchOpen(false);
              }}
            >
              <strong>{e.title}</strong>
              <div style={{ fontSize: 12, color: "var(--main-muted)" }}>
                {new Date(e.start).toLocaleString()} {e.location ? `· ${e.location}` : ""}
              </div>
            </button>
          ))}
          {taskHits.map((t) => (
            <button key={t.id}>
              Task · {t.title}
            </button>
          ))}
          {hits.length === 0 && taskHits.length === 0 && <div className="empty">No matches</div>}
        </div>
      </div>
    </div>
  );
}
