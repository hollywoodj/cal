import {
  addDays,
  addHours,
  addMinutes,
  addMonths,
  addWeeks,
  addYears,
  getDay,
  setDate,
  setMonth,
  startOfDay,
  startOfMonth,
} from "date-fns";
import type { ParseResult, RecurrenceRule, Token, TokenKind } from "../types";

const WEEKDAY_MAP: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const TZ_MAP: Record<string, string> = {
  et: "America/New_York",
  est: "America/New_York",
  edt: "America/New_York",
  ct: "America/Chicago",
  cst: "America/Chicago",
  cdt: "America/Chicago",
  mt: "America/Denver",
  mst: "America/Denver",
  mdt: "America/Denver",
  pt: "America/Los_Angeles",
  pst: "America/Los_Angeles",
  pdt: "America/Los_Angeles",
  utc: "UTC",
  gmt: "UTC",
};

const WEEKDAY_ALT = "sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?";
const MONTH_ALT =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

interface Hit {
  start: number;
  end: number;
  kind: TokenKind;
  data?: Record<string, unknown>;
}

function maskOverlaps(mask: boolean[], start: number, end: number) {
  for (let i = start; i < end; i++) if (mask[i]) return true;
  return false;
}

function paint(mask: boolean[], start: number, end: number) {
  for (let i = start; i < end; i++) mask[i] = true;
}

function addHit(hits: Hit[], mask: boolean[], hit: Hit) {
  if (hit.start < 0 || hit.end > mask.length || hit.start >= hit.end) return false;
  if (maskOverlaps(mask, hit.start, hit.end)) return false;
  paint(mask, hit.start, hit.end);
  hits.push(hit);
  return true;
}

function findAll(text: string, re: RegExp) {
  const out: RegExpExecArray[] = [];
  const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
  const r = new RegExp(re.source, flags);
  let m: RegExpExecArray | null;
  while ((m = r.exec(text))) out.push(m);
  return out;
}

function inferHour(hour: number, mer: string | undefined) {
  if (mer) {
    const isPm = mer.toLowerCase().startsWith("p");
    const isAm = mer.toLowerCase().startsWith("a");
    if (isPm && hour < 12) return hour + 12;
    if (isAm && hour === 12) return 0;
    return hour;
  }
  if (hour === 12) return 12;
  if (hour >= 1 && hour <= 7) return hour + 12;
  return hour;
}

function upcomingWeekday(from: Date, weekday: number, preferNext = false) {
  const current = getDay(from);
  let delta = (weekday - current + 7) % 7;
  if (delta === 0 && preferNext) delta = 7;
  if (delta === 0) {
    return startOfDay(from);
  }
  return startOfDay(addDays(from, delta));
}

function applyTime(day: Date, hour: number, minute: number) {
  const d = startOfDay(day);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function nextMonthDay(from: Date, month: number, day: number, year?: number) {
  if (year != null) {
    const d = new Date(year, month, day);
    return startOfDay(d);
  }
  let candidate = setDate(setMonth(startOfDay(from), month), day);
  if (candidate < startOfDay(from)) {
    candidate = addYears(candidate, 1);
  }
  return candidate;
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number) {
  const start = startOfMonth(new Date(year, month, 1));
  let d = start;
  while (getDay(d) !== weekday) d = addDays(d, 1);
  if (nth === -1) {
    let last = d;
    while (d.getMonth() === month) {
      last = d;
      d = addDays(d, 7);
    }
    return last;
  }
  d = addDays(d, (nth - 1) * 7);
  return d;
}

function weekdayFromToken(s: string): number | undefined {
  const raw = s.toLowerCase();
  if (WEEKDAY_MAP[raw] !== undefined) return WEEKDAY_MAP[raw];
  if (raw.endsWith("s") && WEEKDAY_MAP[raw.slice(0, -1)] !== undefined) {
    return WEEKDAY_MAP[raw.slice(0, -1)];
  }
  return undefined;
}

function leftoverTitle(text: string, mask: boolean[]) {
  let s = "";
  for (let i = 0; i < text.length; i++) {
    if (!mask[i]) s += text[i];
    else s += " ";
  }
  return s.replace(/\s+/g, " ").trim().replace(/^[,;:.\-]+|[,;:.\-]+$/g, "").trim();
}

function tokensFromHits(text: string, hits: Hit[]): Token[] {
  return hits
    .slice()
    .sort((a, b) => a.start - b.start)
    .map((h) => ({
      start: h.start,
      end: h.end,
      kind: h.kind,
      text: text.slice(h.start, h.end),
    }));
}

export interface ParseOptions {
  now?: Date;
  selectedDate?: Date;
  calendarNames?: string[];
}

export function parseSentence(input: string, options: ParseOptions = {}): ParseResult {
  const now = options.now ?? new Date();
  const selected = options.selectedDate ?? now;
  const raw = input;
  const text = input;
  const lower = text.toLowerCase();
  const mask = Array.from({ length: text.length }, () => false);
  const hits: Hit[] = [];

  let isTask = false;
  let priority: 0 | 1 | 2 | 3 = 0;
  let titleOverride: string | undefined;
  let location: string | undefined;
  let invitees: string[] = [];
  let calendarQuery: string | undefined;
  let url: string | undefined;
  let alertMinutes: number | undefined;
  let recurrence: RecurrenceRule | undefined;
  let timezone: string | undefined;
  let start: Date | null = null;
  let end: Date | null = null;
  let allDay = true;
  let durationMinutes: number | undefined;
  let hasExplicitDate = false;
  let hasExplicitTime = false;
  let untilDate: Date | undefined;
  let notes: string | undefined;

  for (const m of findAll(text, /"([^"]+)"/g)) {
    titleOverride = m[1];
    addHit(hits, mask, { start: m.index, end: m.index + m[0].length, kind: "title" });
  }

  for (const m of findAll(text, /https?:\/\/\S+/gi)) {
    url = m[0].replace(/[),.;]+$/, "");
    addHit(hits, mask, { start: m.index, end: m.index + m[0].length, kind: "url" });
  }

  for (const m of findAll(text, /(?:^|\s)(\/(?:[A-Za-z0-9][\w-]*)+)/g)) {
    const token = m[1];
    const abs = m.index + m[0].indexOf(token);
    calendarQuery = token.slice(1);
    addHit(hits, mask, { start: abs, end: abs + token.length, kind: "calendar" });
  }

  const taskPrefix = /^(?:task|todo|reminder|√)\b[\s:]*/i.exec(text);
  if (taskPrefix) {
    isTask = true;
    addHit(hits, mask, { start: 0, end: taskPrefix[0].length, kind: "task" });
  }

  const bangs = /(!{1,3})\s*$/.exec(text);
  if (bangs) {
    priority = bangs[1].length as 1 | 2 | 3;
    isTask = true;
    addHit(hits, mask, {
      start: bangs.index,
      end: bangs.index + bangs[1].length,
      kind: "priority",
    });
  }

  const colonRepeat = /:(daily|weekly|monthly|yearly)\b/i.exec(lower);
  if (colonRepeat && colonRepeat.index != null) {
    recurrence = {
      freq: colonRepeat[1].toLowerCase() as RecurrenceRule["freq"],
      interval: 1,
    };
    addHit(hits, mask, {
      start: colonRepeat.index,
      end: colonRepeat.index + colonRepeat[0].length,
      kind: "repeat",
    });
  }

  const alertMatch =
    /\balert\s+(\d+)\s*(minutes?|mins?|hours?|hrs?|days?)\b/i.exec(text);
  if (alertMatch) {
    const n = parseInt(alertMatch[1], 10);
    const unit = alertMatch[2].toLowerCase();
    alertMinutes = unit.startsWith("day")
      ? n * 24 * 60
      : unit.startsWith("h")
        ? n * 60
        : n;
    addHit(hits, mask, {
      start: alertMatch.index,
      end: alertMatch.index + alertMatch[0].length,
      kind: "alert",
    });
  }

  const everyYear = new RegExp(
    `\\bevery\\s+year\\b(?:\\s+on)?\\s+((?:${MONTH_ALT})\\s+\\d{1,2}(?:st|nd|rd|th)?|\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?)`,
    "i",
  ).exec(text);
  if (everyYear) {
    const parsed = parseDatePhrase(everyYear[1], now);
    if (parsed) {
      start = parsed;
      allDay = true;
      hasExplicitDate = true;
      recurrence = {
        freq: "yearly",
        interval: 1,
        byMonth: parsed.getMonth() + 1,
        byMonthDay: parsed.getDate(),
      };
      addHit(hits, mask, {
        start: everyYear.index,
        end: everyYear.index + everyYear[0].length,
        kind: "repeat",
      });
    }
  }

  const nthFriday = new RegExp(
    `\\bon\\s+the\\s+(\\d+(?:st|nd|rd|th)|last)\\s+(${WEEKDAY_ALT})\\s+of\\s+every\\s+month\\b`,
    "i",
  ).exec(text);
  if (nthFriday) {
    const nthRaw = nthFriday[1].toLowerCase();
    const nth = nthRaw === "last" ? -1 : parseInt(nthRaw, 10);
    const wd = WEEKDAY_MAP[nthFriday[2].toLowerCase()];
    const y = now.getFullYear();
    const m = now.getMonth();
    let d = nthWeekdayOfMonth(y, m, wd, nth);
    if (d < startOfDay(now)) d = nthWeekdayOfMonth(y, m + 1, wd, nth);
    start = d;
    hasExplicitDate = true;
    recurrence = {
      freq: "monthly",
      interval: 1,
      byWeekday: [wd],
      bySetPos: nth,
    };
    addHit(hits, mask, {
      start: nthFriday.index,
      end: nthFriday.index + nthFriday[0].length,
      kind: "repeat",
    });
  }

  const everyWeekdays = new RegExp(
    `\\bevery\\s+((?:${WEEKDAY_ALT})(?:s)?(?:\\s*(?:,|and)\\s*(?:${WEEKDAY_ALT})(?:s)?)*)`,
    "i",
  ).exec(text);
  if (everyWeekdays && !recurrence) {
    const days = [...everyWeekdays[1].matchAll(new RegExp(WEEKDAY_ALT, "gi"))]
      .map((x) => weekdayFromToken(x[0]))
      .filter((n): n is number => n !== undefined);
    const unique = [...new Set(days)];
    if (unique.length) {
      recurrence = { freq: "weekly", interval: 1, byWeekday: unique };
      start = upcomingWeekday(now, unique[0], unique[0] === getDay(now) && now.getHours() >= 21);
      hasExplicitDate = true;
      addHit(hits, mask, {
        start: everyWeekdays.index,
        end: everyWeekdays.index + everyWeekdays[0].length,
        kind: "repeat",
      });
    }
  }

  const bareWeekdaysPlural = new RegExp(
    `\\b((?:${WEEKDAY_ALT})s(?:\\s*(?:,|and)\\s*(?:${WEEKDAY_ALT})s)+|(?:${WEEKDAY_ALT})s)\\b`,
    "i",
  ).exec(text);
  if (bareWeekdaysPlural && !recurrence) {
    const days = [...bareWeekdaysPlural[0].matchAll(new RegExp(`(?:${WEEKDAY_ALT})s`, "gi"))]
      .map((x) => WEEKDAY_MAP[x[0].toLowerCase().slice(0, -1)])
      .filter((n) => n !== undefined) as number[];
    const unique = [...new Set(days)];
    if (unique.length) {
      recurrence = { freq: "weekly", interval: 1, byWeekday: unique };
      start = upcomingWeekday(now, unique[0]);
      hasExplicitDate = true;
      addHit(hits, mask, {
        start: bareWeekdaysPlural.index,
        end: bareWeekdaysPlural.index + bareWeekdaysPlural[0].length,
        kind: "repeat",
      });
    }
  }

  const everyN = /\bevery\s+(\d+)\s+(days?|weeks?|months?|years?)\b/i.exec(text);
  if (everyN && !recurrence) {
    const n = parseInt(everyN[1], 10);
    const unit = everyN[2].toLowerCase();
    const freq = unit.startsWith("day")
      ? "daily"
      : unit.startsWith("week")
        ? "weekly"
        : unit.startsWith("month")
          ? "monthly"
          : "yearly";
    recurrence = { freq, interval: n };
    addHit(hits, mask, {
      start: everyN.index,
      end: everyN.index + everyN[0].length,
      kind: "repeat",
    });
  }

  if (!recurrence) {
    const everyWord = /\bevery\s+(day|week|month|year)\b/i.exec(text);
    if (everyWord) {
      const u = everyWord[1].toLowerCase();
      recurrence = {
        freq: (u === "day" ? "daily" : u === "week" ? "weekly" : u === "month" ? "monthly" : "yearly"),
        interval: 1,
      };
      addHit(hits, mask, {
        start: everyWord.index,
        end: everyWord.index + everyWord[0].length,
        kind: "repeat",
      });
    }
  }

  const untilMatch = /\buntil\s+((?:the\s+)?(?:\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|(?:${MONTH_ALT})\s+\d{1,2}(?:st|nd|rd|th)?|\d{1,2}(?:st|nd|rd|th)?))/i.exec(
    text,
  );
  if (untilMatch) {
    const d = parseDatePhrase(untilMatch[1], now);
    if (d) {
      untilDate = d;
      if (recurrence) recurrence.until = d.toISOString();
      addHit(hits, mask, {
        start: untilMatch.index,
        end: untilMatch.index + untilMatch[0].length,
        kind: "date",
      });
    }
  }

  const fromTo = new RegExp(
    `\\bfrom\\s+((?:${MONTH_ALT})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:\\s*[–\\-]\\s*\\d{1,2}(?:st|nd|rd|th)?)?|\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?)(?:\\s*(?:to|through|–|-)\\s*((?:${MONTH_ALT})\\s+\\d{1,2}(?:st|nd|rd|th)?|\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?|\\d{1,2}(?:st|nd|rd|th)?))?`,
    "i",
  ).exec(text);
  if (fromTo) {
    const startPhrase = fromTo[1];
    const dashInStart = startPhrase.match(
      new RegExp(`^((?:${MONTH_ALT})\\s+)(\\d{1,2})(?:st|nd|rd|th)?\\s*[–\\-]\\s*(\\d{1,2})(?:st|nd|rd|th)?$`, "i"),
    );
    let a: Date | null = null;
    let b: Date | null = null;
    if (dashInStart) {
      a = parseDatePhrase(dashInStart[1] + dashInStart[2], now);
      b = a ? parseDatePhrase(dashInStart[1] + dashInStart[3], now) : null;
    } else {
      a = parseDatePhrase(startPhrase, now);
      if (fromTo[2]) b = parseDatePhrase(fromTo[2], now, a ?? now);
    }
    if (a) {
      start = a;
      hasExplicitDate = true;
      if (b) {
        untilDate = b;
        if (recurrence) {
          recurrence.until = b.toISOString();
        } else {
          end = b;
          allDay = true;
        }
      }
      addHit(hits, mask, {
        start: fromTo.index,
        end: fromTo.index + fromTo[0].length,
        kind: "date",
      });
    }
  }

  const durationMatch = /\bfor\s+(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?|days?)\b/i.exec(text);
  if (durationMatch) {
    const n = parseFloat(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    durationMinutes = unit.startsWith("day")
      ? n * 24 * 60
      : unit.startsWith("h")
        ? n * 60
        : n;
    addHit(hits, mask, {
      start: durationMatch.index,
      end: durationMatch.index + durationMatch[0].length,
      kind: "duration",
    });
  }

  const timeRange = findTimeRange(text, mask);
  if (timeRange) {
    const startHour = inferHour(timeRange.startHour, timeRange.startMer || timeRange.endMer);
    const endHour = inferHour(timeRange.endHour, timeRange.endMer || timeRange.startMer);
    const day = start ?? startOfDay(selected);
    start = applyTime(day, startHour, timeRange.startMinute);
    end = applyTime(day, endHour, timeRange.endMinute);
    if (end <= start) end = addDays(end, 1);
    allDay = false;
    hasExplicitTime = true;
    addHit(hits, mask, { start: timeRange.index, end: timeRange.index + timeRange.length, kind: "time" });
    if (timeRange.tz) timezone = TZ_MAP[timeRange.tz] ?? timeRange.tz;
  } else {
    const t = findSingleTime(text, mask);
    if (t) {
      const hour = inferHour(t.hour, t.mer);
      const day = start ?? startOfDay(selected);
      start = applyTime(day, hour, t.minute);
      allDay = false;
      hasExplicitTime = true;
      addHit(hits, mask, { start: t.index, end: t.index + t.length, kind: "time" });
      if (t.tz) timezone = TZ_MAP[t.tz] ?? t.tz;
    }
  }

  const namedDates = findAll(
    text,
    /\b(today|tonight|tomorrow|yesterday|next\s+week|next\s+month)\b/gi,
  );
  for (const m of namedDates) {
    if (maskOverlaps(mask, m.index, m.index + m[0].length)) continue;
    const word = m[1].toLowerCase();
    let d = startOfDay(now);
    if (word === "tonight") {
      d = startOfDay(now);
      if (!hasExplicitTime) {
        start = applyTime(now, 19, 0);
        hasExplicitTime = true;
        allDay = false;
      } else if (start) {
        start = applyTime(now, start.getHours(), start.getMinutes());
        if (end) end = applyTime(now, end.getHours(), end.getMinutes());
      }
    } else if (word === "today") d = startOfDay(now);
    else if (word === "tomorrow") d = addDays(startOfDay(now), 1);
    else if (word === "yesterday") d = addDays(startOfDay(now), -1);
    else if (word === "next week") d = addWeeks(upcomingWeekday(now, 1, true), 0);
    else if (word === "next month") d = startOfMonth(addMonths(now, 1));
    if (start && hasExplicitTime) {
      start = applyTime(d, start.getHours(), start.getMinutes());
      if (end) end = applyTime(d, end.getHours(), end.getMinutes());
    } else if (!start) {
      start = d;
    } else if (!hasExplicitDate) {
      start = hasExplicitTime ? applyTime(d, start.getHours(), start.getMinutes()) : d;
    }
    hasExplicitDate = true;
    addHit(hits, mask, { start: m.index, end: m.index + m[0].length, kind: "date" });
  }

  const inRel = /\bin\s+(\d+)\s+(minutes?|mins?|hours?|hrs?|days?|weeks?|months?)\b/i.exec(text);
  if (inRel && !maskOverlaps(mask, inRel.index, inRel.index + inRel[0].length)) {
    const n = parseInt(inRel[1], 10);
    const unit = inRel[2].toLowerCase();
    let d = now;
    if (unit.startsWith("min")) d = addMinutes(now, n);
    else if (unit.startsWith("h")) d = addHours(now, n);
    else if (unit.startsWith("day")) d = addDays(now, n);
    else if (unit.startsWith("week")) d = addWeeks(now, n);
    else d = addMonths(now, n);
    start = d;
    allDay = unit.startsWith("day") || unit.startsWith("week") || unit.startsWith("month");
    hasExplicitDate = true;
    if (!allDay) hasExplicitTime = true;
    addHit(hits, mask, { start: inRel.index, end: inRel.index + inRel[0].length, kind: "date" });
  }

  const mdY = findAll(
    text,
    new RegExp(
      `\\b((?:${MONTH_ALT})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:\\s*,\\s*\\d{4})?|\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?)\\b`,
      "gi",
    ),
  );
  for (const m of mdY) {
    if (maskOverlaps(mask, m.index, m.index + m[0].length)) continue;
    const d = parseDatePhrase(m[1], now);
    if (!d) continue;
    if (start && hasExplicitTime) {
      start = applyTime(d, start.getHours(), start.getMinutes());
      if (end) end = applyTime(d, end.getHours(), end.getMinutes());
    } else {
      start = d;
    }
    hasExplicitDate = true;
    addHit(hits, mask, { start: m.index, end: m.index + m[0].length, kind: "date" });
  }

  const nextWeekday = new RegExp(`\\b(this|next|last)\\s+(${WEEKDAY_ALT})\\b`, "gi");
  for (const m of findAll(text, nextWeekday)) {
    if (maskOverlaps(mask, m.index, m.index + m[0].length)) continue;
    const wd = WEEKDAY_MAP[m[2].toLowerCase()];
    const which = m[1].toLowerCase();
    let d: Date;
    if (which === "next") d = upcomingWeekday(now, wd, true);
    else if (which === "last") d = addDays(upcomingWeekday(now, wd), -7);
    else d = upcomingWeekday(now, wd, false);
    if (start && hasExplicitTime) {
      start = applyTime(d, start.getHours(), start.getMinutes());
      if (end) end = applyTime(d, end.getHours(), end.getMinutes());
    } else start = d;
    hasExplicitDate = true;
    addHit(hits, mask, { start: m.index, end: m.index + m[0].length, kind: "date" });
  }

  const bareWd = new RegExp(`\\b(?:on\\s+)?(${WEEKDAY_ALT})\\b`, "gi");
  for (const m of findAll(text, bareWd)) {
    if (maskOverlaps(mask, m.index, m.index + m[0].length)) continue;
    const wd = WEEKDAY_MAP[m[1].toLowerCase()];
    const preferNext = wd === getDay(now) && hasExplicitTime && start != null && start < now;
    const d = upcomingWeekday(now, wd, preferNext);
    if (start && hasExplicitTime) {
      start = applyTime(d, start.getHours(), start.getMinutes());
      if (end) end = applyTime(d, end.getHours(), end.getMinutes());
    } else start = d;
    hasExplicitDate = true;
    addHit(hits, mask, { start: m.index, end: m.index + m[0].length, kind: "date" });
  }

  const due = /\b(?:due(?:\s+on)?|by)\s+/i.exec(text);
  if (due) {
    isTask = true;
    addHit(hits, mask, { start: due.index, end: due.index + due[0].length, kind: "task" });
  }

  const withMatches = findAll(text, /\bwith\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})\b/g);
  for (const m of withMatches) {
    if (maskOverlaps(mask, m.index, m.index + m[0].length)) continue;
    invitees.push(m[1]);
    addHit(hits, mask, { start: m.index, end: m.index + m[0].length, kind: "person" });
  }

  const atLoc = findAll(text, /\bat\s+/gi);
  for (const m of atLoc) {
    if (maskOverlaps(mask, m.index, m.index + m[0].length)) continue;
    const startIdx = m.index + m[0].length;
    const loc = readLocation(text, startIdx, mask);
    if (!loc) continue;
    location = loc.text;
    addHit(hits, mask, { start: m.index, end: loc.end, kind: "location" });
    break;
  }

  if (!start) start = startOfDay(selected);

  if (hasExplicitTime && start && !end) {
    const dur = durationMinutes ?? 60;
    end = addMinutes(start, dur);
    allDay = false;
  }

  if (!hasExplicitTime) {
    allDay = true;
    if (!end) end = start;
    if (durationMinutes && durationMinutes >= 24 * 60) {
      end = addMinutes(start, durationMinutes);
    }
  } else if (durationMinutes && start && (!timeRange || !end)) {
    end = addMinutes(start, durationMinutes);
  }

  if (untilDate && recurrence) {
    recurrence.until = untilDate.toISOString();
  }

  if (recurrence && start && hasExplicitTime && end) {
    allDay = false;
  }

  let title = titleOverride ?? leftoverTitle(text, mask);
  title = title
    .replace(/\b(?:on|at|from|to|by|with|every|until|due)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[,;:.\-]+|[,;:.\-]+$/g, "")
    .trim();
  if (!title) title = isTask ? "New Task" : "New Event";

  if (timezone && start) {
    notes = `Timezone: ${timezone}`;
  }

  const tokens = tokensFromHits(text, hits);
  const confidence =
    (hasExplicitDate ? 0.3 : 0.1) +
    (hasExplicitTime ? 0.3 : 0) +
    (title !== "New Event" ? 0.2 : 0) +
    (hits.length > 1 ? 0.2 : 0.1);

  return {
    title,
    isTask,
    priority,
    start,
    end: end ?? start,
    allDay,
    location,
    invitees,
    calendarQuery,
    url,
    alertMinutes,
    recurrence,
    timezone,
    tokens,
    durationMinutes,
    raw,
    confidence: Math.min(1, confidence),
    notes,
  };
}

function parseDatePhrase(phrase: string, now: Date, relativeTo?: Date): Date | null {
  const p = phrase.trim().toLowerCase().replace(/(\d+)(st|nd|rd|th)/g, "$1");
  const from = relativeTo ?? now;

  const mdY = p.match(new RegExp(`^(${MONTH_ALT})\\s+(\\d{1,2})(?:\\s*,\\s*(\\d{4}))?$`, "i"));
  if (mdY) {
    const month = MONTH_MAP[mdY[1].toLowerCase()];
    const day = parseInt(mdY[2], 10);
    const year = mdY[3] ? parseInt(mdY[3], 10) : undefined;
    return nextMonthDay(from, month, day, year);
  }

  const numeric = p.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (numeric) {
    const month = parseInt(numeric[1], 10) - 1;
    const day = parseInt(numeric[2], 10);
    let year: number | undefined;
    if (numeric[3]) {
      year = parseInt(numeric[3], 10);
      if (year < 100) year += 2000;
    }
    return nextMonthDay(from, month, day, year);
  }

  const dayOnly = p.match(/^(\d{1,2})$/);
  if (dayOnly) {
    const day = parseInt(dayOnly[1], 10);
    let candidate = setDate(startOfMonth(from), day);
    if (candidate < startOfDay(from)) candidate = addMonths(candidate, 1);
    return candidate;
  }

  return null;
}

function readLocation(text: string, startIdx: number, mask: boolean[]) {
  const stop = new Set([
    "today",
    "tomorrow",
    "tonight",
    "yesterday",
    "every",
    "until",
    "from",
    "alert",
    "with",
    "on",
    "at",
    "for",
    ...Object.keys(WEEKDAY_MAP),
    ...Object.keys(MONTH_MAP),
  ]);
  const parts: string[] = [];
  let i = startIdx;
  while (i < text.length && mask[i]) i++;
  while (i < text.length) {
    while (i < text.length && /\s/.test(text[i]) && !mask[i]) i++;
    if (i >= text.length || mask[i]) break;
    const m = /^[\w'.&-]+/.exec(text.slice(i));
    if (!m) break;
    const word = m[0];
    const key = word.toLowerCase().replace(/s$/, "");
    if (stop.has(word.toLowerCase()) || stop.has(key)) break;
    if (/^\d/.test(word)) break;
    if (parts.length && word[0] !== word[0].toUpperCase() && word !== "and" && word !== "the" && word !== "of") break;
    parts.push(word);
    i += word.length;
  }
  const textOut = parts.join(" ").replace(/[.,;:]+$/, "").trim();
  if (!textOut) return null;
  let end = startIdx;
  const joined = text.slice(startIdx, i).trimEnd();
  end = startIdx + joined.length;
  return { text: textOut, end };
}

function findTimeRange(text: string, mask?: boolean[]) {
  const re =
    /\b(?:(?:at|from)\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?\s*(?:-|–|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?(?:\s*(et|est|edt|pt|pst|pdt|ct|cst|mt|utc|gmt))?\b/gi;
  for (const m of findAll(text, re)) {
    if (mask && maskOverlaps(mask, m.index, m.index + m[0].length)) continue;
    const startHour = parseInt(m[1], 10);
    const endHour = parseInt(m[4], 10);
    const startMer = m[3];
    const endMer = m[6];
    if (!startMer && !endMer && !m[2] && !m[5] && endHour > 12) continue;
    return {
      index: m.index,
      length: m[0].length,
      startHour,
      startMinute: m[2] ? parseInt(m[2], 10) : 0,
      startMer,
      endHour,
      endMinute: m[5] ? parseInt(m[5], 10) : 0,
      endMer,
      tz: m[7]?.toLowerCase(),
    };
  }
  return null;
}

function findSingleTime(text: string, mask?: boolean[]) {
  const named = /\b(noon|midnight|morning|afternoon|evening)\b/i.exec(text);
  if (named && !(mask && maskOverlaps(mask, named.index, named.index + named[0].length))) {
    const w = named[1].toLowerCase();
    const map: Record<string, { hour: number; minute: number; mer?: string }> = {
      noon: { hour: 12, minute: 0, mer: "pm" },
      midnight: { hour: 0, minute: 0, mer: "am" },
      morning: { hour: 9, minute: 0, mer: "am" },
      afternoon: { hour: 14, minute: 0, mer: "pm" },
      evening: { hour: 19, minute: 0, mer: "pm" },
    };
    const t = map[w];
    return { index: named.index, length: named[0].length, ...t, tz: undefined as string | undefined };
  }

  const re =
    /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?m\.?|p\.?m\.?|a|p)\b(?:\s*(et|est|edt|pt|pst|pdt|ct|cst|mt|utc|gmt))?\b/gi;
  for (const m of findAll(text, re)) {
    if (mask && maskOverlaps(mask, m.index, m.index + m[0].length)) continue;
    return {
      index: m.index,
      length: m[0].length,
      hour: parseInt(m[1], 10),
      minute: m[2] ? parseInt(m[2], 10) : 0,
      mer: m[3],
      tz: m[4]?.toLowerCase(),
    };
  }

  const military = findAll(text, /\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/g);
  for (const m of military) {
    if (mask && maskOverlaps(mask, m.index, m.index + m[0].length)) continue;
    if (parseInt(m[1], 10) <= 12) continue;
    return {
      index: m.index,
      length: m[0].length,
      hour: parseInt(m[1], 10),
      minute: parseInt(m[2], 10),
      mer: undefined,
      tz: undefined as string | undefined,
    };
  }

  const atNum = findAll(text, /\bat\s+(\d{1,2})(?::(\d{2}))?\b/gi);
  for (const m of atNum) {
    if (mask && maskOverlaps(mask, m.index, m.index + m[0].length)) continue;
    return {
      index: m.index,
      length: m[0].length,
      hour: parseInt(m[1], 10),
      minute: m[2] ? parseInt(m[2], 10) : 0,
      mer: undefined,
      tz: undefined as string | undefined,
    };
  }

  const trailing = findAll(text, /\b(\d{1,2})(?::(\d{2}))\b/g);
  for (const m of trailing) {
    if (mask && maskOverlaps(mask, m.index, m.index + m[0].length)) continue;
    return {
      index: m.index,
      length: m[0].length,
      hour: parseInt(m[1], 10),
      minute: parseInt(m[2], 10),
      mer: undefined,
      tz: undefined as string | undefined,
    };
  }

  return null;
}

export function formatParseSummary(p: ParseResult) {
  if (!p.start) return p.title;
  const date = p.start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (p.allDay) return `${p.title} · ${date} · All-Day`;
  const time = p.start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const end = p.end
    ? p.end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : "";
  return `${p.title} · ${date} · ${time}${end ? ` – ${end}` : ""}`;
}
