import type { CalEvent, Calendar, CalendarSet, Settings, TaskItem } from "../types";
import { APPLE_CALENDAR_COLORS } from "../lib/colors";
import { uid } from "../lib/id";
import { SMART_CALENDARS } from "../calendars/smart/registry";

export const CAL_HOME = "cal_home";
export const CAL_WORK = "cal_work";
export const CAL_PERSONAL = "cal_personal";
export const CAL_BIRTHDAYS = "cal_birthdays";

export function defaultCalendars(): Calendar[] {
  const base: Calendar[] = [
    {
      id: CAL_HOME,
      name: "Home",
      color: APPLE_CALENDAR_COLORS.blue,
      account: "On My Mac",
      visible: true,
      kind: "local",
      writable: true,
    },
    {
      id: CAL_WORK,
      name: "Work",
      color: APPLE_CALENDAR_COLORS.orange,
      account: "Work",
      visible: true,
      kind: "local",
      writable: true,
    },
    {
      id: CAL_PERSONAL,
      name: "Personal",
      color: APPLE_CALENDAR_COLORS.green,
      account: "On My Mac",
      visible: true,
      kind: "local",
      writable: true,
    },
    {
      id: CAL_BIRTHDAYS,
      name: "Birthdays",
      color: APPLE_CALENDAR_COLORS.purple,
      account: "On My Mac",
      visible: true,
      kind: "local",
      writable: true,
    },
  ];

  const smart = SMART_CALENDARS.map((s) => ({
    id: `smart_${s.id}`,
    name: s.name,
    color: s.color,
    account: s.account,
    visible: s.id === "ufc",
    kind: "smart" as const,
    smartId: s.id,
    writable: false,
  }));

  return [...base, ...smart];
}

export function defaultSets(): CalendarSet[] {
  return [
    {
      id: "set_all",
      name: "All Calendars",
      calendarIds: defaultCalendars().filter((c) => c.visible || c.kind === "local").map((c) => c.id),
    },
    {
      id: "set_work",
      name: "Work",
      calendarIds: [CAL_WORK],
      defaultCalendarId: CAL_WORK,
      autoActivate: { kind: "hours", startHour: 9, endHour: 17 },
    },
    {
      id: "set_personal",
      name: "Personal",
      calendarIds: [CAL_HOME, CAL_PERSONAL, CAL_BIRTHDAYS],
      defaultCalendarId: CAL_HOME,
    },
    {
      id: "set_sports",
      name: "Sports",
      calendarIds: [CAL_PERSONAL, "smart_ufc"],
      defaultCalendarId: CAL_PERSONAL,
    },
  ];
}

export const defaultSettings: Settings = {
  appearance: "fantastical",
  weekStartsOn: 0,
  weekViewDays: 7,
  monthWeeks: 6,
  showWeekNumbers: false,
  showDeclined: true,
  hourHeight: 52,
  defaultDurationMinutes: 60,
  defaultAlertMinutes: 15,
  goToTodayAfterAdd: false,
};

function at(y: number, m: number, d: number, h: number, min = 0) {
  return new Date(y, m - 1, d, h, min).toISOString();
}

function event(
  title: string,
  calendarId: string,
  start: string,
  end: string,
  extra: Partial<CalEvent> = {},
): CalEvent {
  return {
    id: uid("evt"),
    title,
    calendarId,
    start,
    end,
    allDay: false,
    invitees: [],
    busyStatus: "busy",
    source: "user",
    ...extra,
  };
}

export function seedEvents(): CalEvent[] {
  const y = 2026;
  const local: CalEvent[] = [
    event("Weekly standup", CAL_WORK, at(y, 8, 26, 9, 30), at(y, 8, 26, 10, 0), {
      recurrence: { freq: "weekly", interval: 1, byWeekday: [3] },
      location: "Zoom",
      conference: "https://zoom.us/j/standup",
      notes: "Team sync — keep it to 30 minutes.",
    }),
    event("Design review", CAL_WORK, at(y, 8, 26, 11, 0), at(y, 8, 26, 12, 0), {
      invitees: ["Maya Chen", "Luis Ortega"],
      location: "Boardroom B",
    }),
    event("Lunch with Sarah", CAL_PERSONAL, at(y, 8, 26, 12, 30), at(y, 8, 26, 13, 30), {
      location: "Cafe Luna",
      invitees: ["Sarah"],
    }),
    event("1:1 with Alex", CAL_WORK, at(y, 8, 26, 14, 0), at(y, 8, 26, 14, 45), {
      invitees: ["Alex Rivera"],
      location: "Meet",
      conference: "https://meet.google.com/alex-1-1",
    }),
    event("Focus block", CAL_WORK, at(y, 8, 26, 15, 0), at(y, 8, 26, 17, 0), {
      notes: "Heads-down on the calendar prototype.",
      busyStatus: "unavailable",
    }),
    event("Gym", CAL_PERSONAL, at(y, 8, 27, 6, 30), at(y, 8, 27, 7, 30), {
      location: "Equinox",
      recurrence: { freq: "weekly", interval: 1, byWeekday: [4] },
    }),
    event("Sprint planning", CAL_WORK, at(y, 8, 27, 10, 0), at(y, 8, 27, 11, 30), {
      location: "HQ — Orion",
      invitees: ["Engineering"],
    }),
    event("Dentist", CAL_HOME, at(y, 8, 27, 16, 0), at(y, 8, 27, 16, 45), {
      location: "Bright Smile Dental",
      alertMinutes: 60,
    }),
    event("Product demo", CAL_WORK, at(y, 8, 28, 15, 0), at(y, 8, 28, 16, 0), {
      invitees: ["Customers", "Sales"],
      url: "https://zoom.us/j/demo",
    }),
    event("Grocery shopping", CAL_HOME, at(y, 8, 29, 10, 0), at(y, 8, 29, 11, 0), {
      location: "Wegmans",
    }),
    event("Family dinner", CAL_HOME, at(y, 8, 30, 18, 0), at(y, 8, 30, 20, 0), {
      location: "Home",
      invitees: ["Family"],
    }),
    event("Maya's birthday", CAL_BIRTHDAYS, at(y, 8, 28, 0, 0), at(y, 8, 28, 23, 59), {
      allDay: true,
      recurrence: { freq: "yearly", interval: 1, byMonth: 8, byMonthDay: 28 },
    }),
    event("Q3 planning offsite", CAL_WORK, at(y, 9, 3, 9, 0), at(y, 9, 3, 17, 0), {
      location: "Napa",
      notes: "Strategy day. Travel the night before.",
    }),
    event("Flight to LA", CAL_PERSONAL, at(y, 9, 18, 16, 10), at(y, 9, 18, 17, 35), {
      location: "SFO → LAX",
      notes: "For UFC 331 weekend.",
      alertMinutes: 180,
    }),
  ];

  const smartEvents: CalEvent[] = [];
  for (const def of SMART_CALENDARS) {
    const calendarId = `smart_${def.id}`;
    const enabled = def.id === "ufc";
    if (!enabled) continue;
    for (const e of def.events) {
      smartEvents.push({
        id: uid(`smart_${def.id}`),
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
        source: `smart:${def.id}`,
      });
    }
  }

  return [...local, ...smartEvents];
}

export function seedTasks(): TaskItem[] {
  return [
    {
      id: uid("task"),
      title: "Submit expense report",
      listId: CAL_WORK,
      due: new Date(2026, 7, 27, 17, 0).toISOString(),
      completed: false,
      priority: 2,
      source: "user",
    },
    {
      id: uid("task"),
      title: "Call dentist to confirm Thursday",
      listId: CAL_HOME,
      due: new Date(2026, 7, 26, 18, 0).toISOString(),
      completed: false,
      priority: 1,
      source: "user",
    },
    {
      id: uid("task"),
      title: "Review Shanghai fight card",
      listId: CAL_PERSONAL,
      due: new Date(2026, 7, 28, 21, 0).toISOString(),
      completed: false,
      priority: 0,
      notes: "Nurmagomedov vs Song — set reminder to watch.",
      source: "user",
    },
    {
      id: uid("task"),
      title: "Pack for Napa offsite",
      listId: CAL_WORK,
      due: new Date(2026, 8, 2, 20, 0).toISOString(),
      completed: false,
      priority: 0,
      source: "user",
    },
  ];
}
