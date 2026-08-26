import { useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Toolbar";
import { ParserBar } from "./components/ParserBar";
import { EventInspector } from "./components/EventInspector";
import { DayView, WeekView } from "./components/WeekView";
import { MonthView, QuarterView, YearView } from "./components/MonthView";
import { TaskView } from "./components/TaskView";
import { SearchModal, SettingsModal, SmartCatalog } from "./components/Modals";
import { useCal } from "./state/store";

export function App() {
  const appearance = useCal((s) => s.settings.appearance);
  const view = useCal((s) => s.view);
  const setView = useCal((s) => s.setView);
  const goToday = useCal((s) => s.goToday);
  const goOffset = useCal((s) => s.goOffset);
  const setActiveSet = useCal((s) => s.setActiveSet);
  const sets = useCal((s) => s.sets);
  const openParser = useCal((s) => s.openParser);
  const setSearchOpen = useCal((s) => s.setSearchOpen);
  const setSettingsOpen = useCal((s) => s.setSettingsOpen);
  const setCatalogOpen = useCal((s) => s.setCatalogOpen);
  const openInspector = useCal((s) => s.openInspector);
  const inspector = useCal((s) => s.inspector);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
      if (e.key === "Escape") {
        openInspector(null);
        setSearchOpen(false);
        setSettingsOpen(false);
        setCatalogOpen(false);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "6") {
        e.preventDefault();
        const views = ["day", "week", "month", "quarter", "year", "tasks"] as const;
        setView(views[Number(e.key) - 1]);
        return;
      }
      if (e.ctrlKey && !e.metaKey && e.key >= "1" && e.key <= "9") {
        const set = sets[Number(e.key) - 1];
        if (set) {
          e.preventDefault();
          setActiveSet(set.id);
        }
        return;
      }
      if (typing) return;
      if (e.key === "t") goToday();
      if (e.key === "n") openParser("");
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f")) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "ArrowLeft") goOffset(-1);
      if (e.key === "ArrowRight") goOffset(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sets, goOffset, goToday, openInspector, openParser, setActiveSet, setCatalogOpen, setSearchOpen, setSettingsOpen, setView]);

  return (
    <div className="app" data-appearance={appearance}>
      <div className="window">
        <header className="titlebar">
          <div className="traffic">
            <i className="c" />
            <i className="y" />
            <i className="g" />
          </div>
          <h1>Fantastical</h1>
        </header>
        <div className="body">
          <Sidebar />
          <section className="main">
            <Toolbar />
            <ParserBar />
            <div className="stage">
              {view === "day" && <DayView />}
              {view === "week" && <WeekView />}
              {view === "month" && <MonthView />}
              {view === "quarter" && <QuarterView />}
              {view === "year" && <YearView />}
              {view === "tasks" && <TaskView />}
              {inspector.eventId && <EventInspector />}
            </div>
          </section>
        </div>
      </div>
      <SmartCatalog />
      <SettingsModal />
      <SearchModal />
    </div>
  );
}
