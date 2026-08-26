export type ViewId = "day" | "week" | "month" | "quarter" | "year" | "tasks";

export type Appearance = "fantastical" | "light" | "dark";

export type BusyStatus = "busy" | "free" | "tentative" | "unavailable";

export type RecurrenceFreq = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurrenceRule {
  freq: RecurrenceFreq;
  interval: number;
  byWeekday?: number[];
  byMonth?: number;
  byMonthDay?: number;
  bySetPos?: number;
  until?: string;
  count?: number;
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  account: string;
  visible: boolean;
  kind: "local" | "smart";
  smartId?: string;
  writable: boolean;
}

export interface CalendarSet {
  id: string;
  name: string;
  calendarIds: string[];
  defaultCalendarId?: string;
  autoActivate?: {
    kind: "hours";
    startHour: number;
    endHour: number;
  };
}

export interface CalEvent {
  id: string;
  title: string;
  calendarId: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  notes?: string;
  url?: string;
  invitees: string[];
  alertMinutes?: number;
  recurrence?: RecurrenceRule;
  busyStatus: BusyStatus;
  source: string;
  conference?: string;
  template?: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  listId: string;
  due?: string;
  completed: boolean;
  priority: 0 | 1 | 2 | 3;
  notes?: string;
  alertMinutes?: number;
  recurrence?: RecurrenceRule;
  source: string;
}

export interface SmartEventSpec {
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
  notes?: string;
  url?: string;
  alertMinutes?: number;
  extra?: Record<string, string>;
}

export interface SmartCalendarDefinition {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: "sports" | "holidays" | "tv" | "education";
  color: string;
  account: string;
  featured?: boolean;
  events: SmartEventSpec[];
  contextHints: (isoDate: string) => string | null;
  parseBoosts?: string[];
}

export type TokenKind =
  | "title"
  | "date"
  | "time"
  | "location"
  | "person"
  | "calendar"
  | "repeat"
  | "alert"
  | "url"
  | "task"
  | "priority"
  | "duration";

export interface Token {
  start: number;
  end: number;
  kind: TokenKind;
  text: string;
}

export interface ParseResult {
  title: string;
  isTask: boolean;
  priority: 0 | 1 | 2 | 3;
  start: Date | null;
  end: Date | null;
  allDay: boolean;
  location?: string;
  invitees: string[];
  calendarQuery?: string;
  url?: string;
  alertMinutes?: number;
  recurrence?: RecurrenceRule;
  timezone?: string;
  tokens: Token[];
  durationMinutes?: number;
  raw: string;
  confidence: number;
  notes?: string;
}

export interface Settings {
  appearance: Appearance;
  weekStartsOn: 0 | 1;
  weekViewDays: 5 | 7;
  monthWeeks: 5 | 6;
  showWeekNumbers: boolean;
  showDeclined: boolean;
  hourHeight: number;
  defaultDurationMinutes: number;
  defaultAlertMinutes?: number;
  goToTodayAfterAdd: boolean;
}
