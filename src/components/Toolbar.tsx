import { ChevronLeft, ChevronRight, PanelLeft, Search, Settings } from "lucide-react";
import { format } from "date-fns";
import { useCal, useSelectedDate } from "../state/store";
import type { ViewId } from "../types";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "year", label: "Year" },
  { id: "tasks", label: "Tasks" },
];

export function Toolbar() {
  const view = useCal((s) => s.view);
  const setView = useCal((s) => s.setView);
  const date = useSelectedDate();
  const goToday = useCal((s) => s.goToday);
  const goOffset = useCal((s) => s.goOffset);
  const toggleSidebar = useCal((s) => s.toggleSidebar);
  const setSearchOpen = useCal((s) => s.setSearchOpen);
  const setSettingsOpen = useCal((s) => s.setSettingsOpen);
  const openParser = useCal((s) => s.openParser);

  const title =
    view === "year"
      ? format(date, "yyyy")
      : view === "quarter"
        ? `${format(date, "MMMM")} – ${format(new Date(date.getFullYear(), date.getMonth() + 2, 1), "MMMM yyyy")}`
        : view === "day"
          ? format(date, "EEEE, MMMM d")
          : format(date, "MMMM yyyy");

  return (
    <div className="toolbar">
      <button className="icon-btn" onClick={toggleSidebar} aria-label="Toggle sidebar" style={{ color: "var(--main-text)" }}>
        <PanelLeft size={16} />
      </button>
      <div className="seg">
        {VIEWS.map((v) => (
          <button key={v.id} className={view === v.id ? "on" : ""} onClick={() => setView(v.id)}>
            {v.label}
          </button>
        ))}
      </div>
      <div className="title">{title}</div>
      <div className="spacer" />
      <button className="ghost" onClick={() => goOffset(-1)} aria-label="Previous">
        <ChevronLeft size={16} />
      </button>
      <button className="ghost" onClick={goToday}>
        Today
      </button>
      <button className="ghost" onClick={() => goOffset(1)} aria-label="Next">
        <ChevronRight size={16} />
      </button>
      <button className="ghost" onClick={() => setSearchOpen(true)}>
        <Search size={15} />
      </button>
      <button className="ghost" onClick={() => setSettingsOpen(true)}>
        <Settings size={15} />
      </button>
      <button className="primary" onClick={() => openParser("")}>
        + Event
      </button>
    </div>
  );
}
