import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  startOfDay,
} from "date-fns";
import type {
  Appearance,
  CalEvent,
  Calendar,
  CalendarSet,
  ParseResult,
  Settings,
  TaskItem,
  ViewId,
} from "../types";
import { uid } from "../lib/id";
import {
  CAL_HOME,
  defaultCalendars,
  defaultSets,
  defaultSettings,
  seedEvents,
  seedTasks,
} from "../data/seed";
import { getSmartCalendar, SMART_CALENDARS } from "../calendars/smart/registry";
import { parseSentence } from "../parser/parse";
import { nextUfcEvent, ufcConflicts } from "../calendars/smart/ufc";
import { expandRecurring, visibleRangeForView } from "../lib/dates";

export interface InspectorState {
  eventId: string | null;
  draft?: Partial<CalEvent>;
}

interface CalState {
  calendars: Calendar[];
  sets: CalendarSet[];
  activeSetId: string;
  events: CalEvent[];
  tasks: TaskItem[];
  templates: CalEvent[];
  settings: Settings;
  selectedDate: string;
  view: ViewId;
  selectedEventId: string | null;
  parserOpen: boolean;
  parserPrefill: string;
  searchOpen: boolean;
  searchQuery: string;
  settingsOpen: boolean;
  catalogOpen: boolean;
  sidebarOpen: boolean;
  inspector: InspectorState;
  hydrated: boolean;

  visibleCalendarIds: () => string[];
  visibleEvents: (rangeStart?: Date, rangeEnd?: Date) => CalEvent[];
  calendarById: (id: string) => Calendar | undefined;
  defaultCalendarId: () => string;
  selectedDateObj: () => Date;
  setView: (view: ViewId) => void;
  setSelectedDate: (d: Date) => void;
  goToday: () => void;
  goOffset: (dir: number) => void;
  setAppearance: (a: Appearance) => void;
  patchSettings: (s: Partial<Settings>) => void;
  setActiveSet: (id: string) => void;
  toggleCalendar: (id: string) => void;
  addCalendar: (name: string, color: string) => void;
  addSet: (name: string, calendarIds: string[]) => void;
  updateSet: (id: string, patch: Partial<CalendarSet>) => void;
  addEvent: (e: Omit<CalEvent, "id"> & { id?: string }) => CalEvent;
  updateEvent: (id: string, patch: Partial<CalEvent>) => void;
  deleteEvent: (id: string) => void;
  duplicateEvent: (id: string) => void;
  saveTemplate: (id: string) => void;
  applyTemplate: (id: string) => void;
  addTask: (t: Omit<TaskItem, "id"> & { id?: string }) => TaskItem;
      updateTask: (id: string, patch: Partial<TaskItem>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  parse: (sentence: string) => ParseResult;
  commitParse: (sentence: string, override?: Partial<ParseResult>) => CalEvent | TaskItem;
  openParser: (prefill?: string) => void;
  closeParser: () => void;
  selectEvent: (id: string | null) => void;
  openInspector: (id: string | null) => void;
  enableSmartCalendar: (smartId: string) => void;
  disableSmartCalendar: (smartId: string) => void;
  isSmartEnabled: (smartId: string) => boolean;
  contextHint: (date?: Date) => string | null;
  overlapWarning: (start: Date, end: Date) => string | null;
  setSearch: (q: string) => void;
  setSearchOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setCatalogOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  resetDemo: () => void;
}

function iso(d: Date) {
  return d.toISOString();
}

function matchCalendar(calendars: Calendar[], query?: string) {
  if (!query) return undefined;
  const q = query.toLowerCase();
  return calendars.find(
    (c) => c.name.toLowerCase() === q || c.name.toLowerCase().startsWith(q) || c.id.toLowerCase().includes(q),
  );
}

export const useCal = create<CalState>()(
  persist(
    (set, get) => ({
      calendars: defaultCalendars(),
      sets: defaultSets(),
      activeSetId: "set_all",
      events: seedEvents(),
      tasks: seedTasks(),
      templates: [],
      settings: defaultSettings,
      selectedDate: iso(new Date(2026, 7, 26)),
      view: "week",
      selectedEventId: null,
      parserOpen: false,
      parserPrefill: "",
      searchOpen: false,
      searchQuery: "",
      settingsOpen: false,
      catalogOpen: false,
      sidebarOpen: true,
      inspector: { eventId: null },
      hydrated: false,

      visibleCalendarIds() {
        const { calendars, sets, activeSetId } = get();
        const setDef = sets.find((s) => s.id === activeSetId);
        const allowed = new Set(setDef?.calendarIds ?? calendars.map((c) => c.id));
        return calendars.filter((c) => c.visible && allowed.has(c.id)).map((c) => c.id);
      },

      calendarById(id) {
        return get().calendars.find((c) => c.id === id);
      },

      defaultCalendarId() {
        const { sets, activeSetId } = get();
        const s = sets.find((x) => x.id === activeSetId);
        return s?.defaultCalendarId || CAL_HOME;
      },

      selectedDateObj() {
        return new Date(get().selectedDate);
      },

      visibleEvents(rangeStart, rangeEnd) {
        const { events, settings, view, selectedDate } = get();
        const ids = new Set(get().visibleCalendarIds());
        const range =
          rangeStart && rangeEnd
            ? { start: rangeStart, end: rangeEnd }
            : visibleRangeForView(view, new Date(selectedDate), settings.weekStartsOn);
        const padStart = addDays(range.start, -7);
        const padEnd = addDays(range.end, 14);
        const out: CalEvent[] = [];
        for (const e of events) {
          if (!ids.has(e.calendarId)) continue;
          out.push(...expandRecurring(e, padStart, padEnd));
        }
        return out;
      },

      setView(view) {
        set({ view });
      },

      setSelectedDate(d) {
        set({ selectedDate: iso(startOfDay(d)) });
      },

      goToday() {
        set({ selectedDate: iso(startOfDay(new Date())) });
      },

      goOffset(dir) {
        const { view, selectedDate, settings } = get();
        const d = new Date(selectedDate);
        let next = d;
        if (view === "day" || view === "tasks") next = addDays(d, dir);
        else if (view === "week") next = addWeeks(d, dir);
        else if (view === "month") next = addMonths(d, dir);
        else if (view === "quarter") next = addMonths(d, dir * 3);
        else next = addYears(d, dir);
        set({ selectedDate: iso(startOfDay(next)) });
        void settings;
      },

      setAppearance(appearance) {
        set({ settings: { ...get().settings, appearance } });
      },

      patchSettings(s) {
        set({ settings: { ...get().settings, ...s } });
      },

      setActiveSet(id) {
        set({ activeSetId: id });
      },

      toggleCalendar(id) {
        set({
          calendars: get().calendars.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)),
        });
      },

      addCalendar(name, color) {
        const cal: Calendar = {
          id: uid("cal"),
          name,
          color,
          account: "On My Mac",
          visible: true,
          kind: "local",
          writable: true,
        };
        set({
          calendars: [...get().calendars, cal],
          sets: get().sets.map((s) =>
            s.id === "set_all" ? { ...s, calendarIds: [...s.calendarIds, cal.id] } : s,
          ),
        });
      },

      addSet(name, calendarIds) {
        const s: CalendarSet = { id: uid("set"), name, calendarIds };
        set({ sets: [...get().sets, s], activeSetId: s.id });
      },

      updateSet(id, patch) {
        set({
          sets: get().sets.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        });
      },

      addEvent(e) {
        const event: CalEvent = {
          ...e,
          invitees: e.invitees ?? [],
          busyStatus: e.busyStatus ?? "busy",
          source: e.source ?? "user",
          allDay: e.allDay ?? false,
          id: e.id ?? uid("evt"),
        };
        set({ events: [...get().events, event], selectedEventId: event.id });
        return event;
      },

      updateEvent(id, patch) {
        const rootId = id.split("::")[0];
        set({
          events: get().events.map((e) => (e.id === rootId || e.id === id ? { ...e, ...patch } : e)),
        });
      },

      deleteEvent(id) {
        const rootId = id.split("::")[0];
        set({
          events: get().events.filter((e) => e.id !== rootId && e.id !== id),
          selectedEventId: get().selectedEventId === id ? null : get().selectedEventId,
          inspector: { eventId: null },
        });
      },

      duplicateEvent(id) {
        const rootId = id.split("::")[0];
        const src = get().events.find((e) => e.id === rootId || e.id === id);
        if (!src) return;
        get().addEvent({ ...src, title: `${src.title} copy` });
      },

      saveTemplate(id) {
        const rootId = id.split("::")[0];
        const src = get().events.find((e) => e.id === rootId || e.id === id);
        if (!src) return;
        set({
          templates: [
            ...get().templates,
            { ...src, id: uid("tpl"), template: true, title: src.title },
          ],
        });
      },

      applyTemplate(id) {
        const tpl = get().templates.find((t) => t.id === id);
        if (!tpl) return;
        const start = new Date(get().selectedDate);
        const origS = new Date(tpl.start);
        const origE = new Date(tpl.end);
        const dur = origE.getTime() - origS.getTime();
        start.setHours(origS.getHours(), origS.getMinutes(), 0, 0);
        get().addEvent({
          ...tpl,
          template: false,
          start: start.toISOString(),
          end: new Date(start.getTime() + dur).toISOString(),
        });
      },

      addTask(t) {
        const task: TaskItem = {
          ...t,
          completed: t.completed ?? false,
          priority: t.priority ?? 0,
          source: t.source ?? "user",
          listId: t.listId ?? get().defaultCalendarId(),
          id: t.id ?? uid("task"),
        };
        set({ tasks: [...get().tasks, task] });
        return task;
      },

      updateTask(id, patch) {
        set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
      },

      toggleTask(id) {
        set({
          tasks: get().tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
        });
      },

      deleteTask(id) {
        set({ tasks: get().tasks.filter((t) => t.id !== id) });
      },

      parse(sentence) {
        const { selectedDate, calendars } = get();
        const result = parseSentence(sentence, {
          now: new Date(),
          selectedDate: new Date(selectedDate),
          calendarNames: calendars.map((c) => c.name),
        });
        const boost = applySmartParseBoost(sentence, result, get());
        return boost;
      },

      commitParse(sentence, override) {
        const parsed = { ...get().parse(sentence), ...override };
        const cal =
          matchCalendar(get().calendars, parsed.calendarQuery) ??
          get().calendars.find((c) => c.id === get().defaultCalendarId()) ??
          get().calendars[0];

        if (parsed.isTask) {
          return get().addTask({
            title: parsed.title,
            listId: cal.id,
            due: parsed.start?.toISOString(),
            completed: false,
            priority: parsed.priority,
            notes: parsed.notes,
            alertMinutes: parsed.alertMinutes,
            recurrence: parsed.recurrence,
            source: "user",
          });
        }

        const start = parsed.start ?? new Date(get().selectedDate);
        const end = parsed.end ?? new Date(start.getTime() + get().settings.defaultDurationMinutes * 60_000);
        return get().addEvent({
          title: parsed.title,
          calendarId: cal.id,
          start: start.toISOString(),
          end: end.toISOString(),
          allDay: parsed.allDay,
          location: parsed.location,
          notes: parsed.notes,
          url: parsed.url,
          invitees: parsed.invitees,
          alertMinutes: parsed.alertMinutes ?? get().settings.defaultAlertMinutes,
          recurrence: parsed.recurrence,
          busyStatus: "busy",
          source: "user",
          conference: parsed.url?.match(/zoom|meet|teams|webex/i) ? parsed.url : undefined,
        });
      },

      openParser(prefill = "") {
        set({ parserOpen: true, parserPrefill: prefill });
      },

      closeParser() {
        set({ parserOpen: false, parserPrefill: "" });
      },

      selectEvent(id) {
        set({ selectedEventId: id });
      },

      openInspector(id) {
        set({ inspector: { eventId: id }, selectedEventId: id });
      },

      enableSmartCalendar(smartId) {
        const def = getSmartCalendar(smartId);
        if (!def) return;
        const calendarId = `smart_${smartId}`;
        const calendars = get().calendars.map((c) =>
          c.id === calendarId ? { ...c, visible: true } : c,
        );
        const remaining = get().events.filter((e) => e.source !== `smart:${smartId}`);
        const injected: CalEvent[] = def.events.map((e) => ({
          id: uid(`smart_${smartId}`),
          title: e.title,
          calendarId,
          start: e.start,
          end: e.end,
          allDay: Boolean(e.allDay),
          location: e.location,
          notes: e.notes,
          url: e.url,
          invitees: [],
          alertMinutes: e.alertMinutes,
          busyStatus: "free",
          source: `smart:${smartId}`,
        }));
        const sets = get().sets.map((s) =>
          s.id === "set_all" && !s.calendarIds.includes(calendarId)
            ? { ...s, calendarIds: [...s.calendarIds, calendarId] }
            : s,
        );
        set({ calendars, events: [...remaining, ...injected], sets });
      },

      disableSmartCalendar(smartId) {
        const calendarId = `smart_${smartId}`;
        set({
          calendars: get().calendars.map((c) => (c.id === calendarId ? { ...c, visible: false } : c)),
          events: get().events.filter((e) => e.source !== `smart:${smartId}`),
        });
      },

      isSmartEnabled(smartId) {
        const cal = get().calendars.find((c) => c.smartId === smartId);
        return Boolean(cal?.visible);
      },

      contextHint(date) {
        const d = date ?? new Date(get().selectedDate);
        const enabled = SMART_CALENDARS.filter((s) => get().isSmartEnabled(s.id));
        for (const s of enabled) {
          const hint = s.contextHints(d.toISOString());
          if (hint) return hint;
        }
        return null;
      },

      overlapWarning(start, end) {
        if (!get().isSmartEnabled("ufc")) return null;
        const hits = ufcConflicts(start, end);
        if (!hits.length) return null;
        return `Overlaps ${hits[0].title}`;
      },

      setSearch(q) {
        set({ searchQuery: q });
      },
      setSearchOpen(open) {
        set({ searchOpen: open });
      },
      setSettingsOpen(open) {
        set({ settingsOpen: open });
      },
      setCatalogOpen(open) {
        set({ catalogOpen: open });
      },
      toggleSidebar() {
        set({ sidebarOpen: !get().sidebarOpen });
      },
      resetDemo() {
        set({
          calendars: defaultCalendars(),
          sets: defaultSets(),
          activeSetId: "set_all",
          events: seedEvents(),
          tasks: seedTasks(),
          templates: [],
          settings: defaultSettings,
          selectedDate: iso(new Date(2026, 7, 26)),
          view: "week",
        });
      },
    }),
    {
      name: "fantastical-clone-v2",
      partialize: (s) => ({
        calendars: s.calendars,
        sets: s.sets,
        activeSetId: s.activeSetId,
        events: s.events,
        tasks: s.tasks,
        templates: s.templates,
        settings: s.settings,
        selectedDate: s.selectedDate,
        view: s.view,
      }),
    },
  ),
);

export function useVisibleEvents() {
  const events = useCal((s) => s.events);
  const calendars = useCal((s) => s.calendars);
  const sets = useCal((s) => s.sets);
  const activeSetId = useCal((s) => s.activeSetId);
  const view = useCal((s) => s.view);
  const selectedDate = useCal((s) => s.selectedDate);
  const weekStartsOn = useCal((s) => s.settings.weekStartsOn);
  return useMemo(
    () => useCal.getState().visibleEvents(),
    [events, calendars, sets, activeSetId, view, selectedDate, weekStartsOn],
  );
}

export function useSelectedDate() {
  const iso = useCal((s) => s.selectedDate);
  return useMemo(() => new Date(iso), [iso]);
}

export function useContextHint() {
  const iso = useCal((s) => s.selectedDate);
  const calendars = useCal((s) => s.calendars);
  return useMemo(() => useCal.getState().contextHint(new Date(iso)), [iso, calendars]);
}

function applySmartParseBoost(sentence: string, result: ParseResult, state: CalState): ParseResult {
  const lower = sentence.toLowerCase();
  if (!state.isSmartEnabled("ufc")) return result;
  const hitsUfc =
    /\b(ufc|fight night?|contender series|dana white|ppv|watch the fight|fight card)\b/i.test(
      lower,
    );
  if (!hitsUfc) return result;
  const next = nextUfcEvent(result.start ?? new Date());
  if (!next) return result;
  if (result.title === "New Event" || /^ufc\b/i.test(result.title) || /^watch\b/i.test(result.title)) {
    return {
      ...result,
      title: next.title,
      start: new Date(next.start),
      end: new Date(next.end),
      allDay: false,
      location: next.location,
      notes: next.notes,
      url: next.url,
      calendarQuery: "ufc",
      confidence: 0.95,
    };
  }
  return result;
}
