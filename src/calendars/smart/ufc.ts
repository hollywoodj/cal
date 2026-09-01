import type { SmartCalendarDefinition, SmartEventSpec } from "../../types";

function ev(
  title: string,
  startLocal: string,
  hours: number,
  location: string,
  notes: string,
  extra?: Partial<SmartEventSpec>,
): SmartEventSpec {
  const start = new Date(startLocal);
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
  return {
    title,
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: false,
    location,
    notes,
    url: "https://www.ufc.com/events",
    alertMinutes: 60,
    ...extra,
  };
}

const NOTES = {
  watch: "Stream on Paramount+. Main card typically follows prelims. Times listed in ET.",
};

export const UFC_EVENTS: SmartEventSpec[] = [
  ev(
    "UFC 329: McGregor vs. Holloway 2",
    "2026-07-11T21:00:00",
    5,
    "T-Mobile Arena, Las Vegas, NV",
    `Main event: Conor McGregor vs. Max Holloway\n${NOTES.watch}`,
  ),
  ev(
    "UFC Fight Night: Du Plessis vs. Usman",
    "2026-07-18T20:00:00",
    3.5,
    "Paycom Center, Oklahoma City, OK",
    `Main event: Dricus Du Plessis vs. Kamaru Usman\n${NOTES.watch}`,
  ),
  ev(
    "UFC Fight Night: Ankalaev vs. Guskov",
    "2026-07-25T12:00:00",
    3.5,
    "Etihad Arena, Abu Dhabi, UAE",
    `Main event: Magomed Ankalaev vs. Bogdan Guskov\n${NOTES.watch}`,
  ),
  ev(
    "UFC Fight Night: Medić vs. Rodriguez",
    "2026-08-01T13:00:00",
    3.5,
    "Belgrade Arena, Belgrade, Serbia",
    `Main event: Medić vs. Rodriguez\n${NOTES.watch}`,
  ),
  ev(
    "UFC Fight Night: Gamrot vs. Salkilld",
    "2026-08-08T20:00:00",
    3.5,
    "UFC APEX, Las Vegas, NV",
    `Main event: Mateusz Gamrot vs. Salkilld\n${NOTES.watch}`,
  ),
  ev(
    "UFC 330: Makhachev vs. Machado Garry",
    "2026-08-15T21:00:00",
    5,
    "Xfinity Mobile Arena, Philadelphia, PA",
    `Main event: Islam Makhachev vs. Ian Machado Garry\nLightweight title\n${NOTES.watch}`,
  ),
  ev(
    "UFC Fight Night: Hernandez vs. Rodrigues",
    "2026-08-22T20:00:00",
    3.5,
    "Golden 1 Center, Sacramento, CA",
    `Main event: Hernandez vs. Rodrigues\n${NOTES.watch}`,
  ),
  ev(
    "UFC Fight Night: Nurmagomedov vs. Song",
    "2026-08-29T03:00:00",
    3.5,
    "Shanghai Oriental Sports Center, Shanghai, China",
    `Main event: Umar Nurmagomedov vs. Song Yadong\nBantamweight\nPrelims start earlier Saturday morning ET.\n${NOTES.watch}`,
    { extra: { mainEvent: "Nurmagomedov vs. Song", card: "Fight Night", city: "Shanghai" } },
  ),
  ev(
    "Dana White's Contender Series: Season 10, Week 4",
    "2026-09-01T19:00:00",
    2,
    "UFC APEX, Las Vegas, NV",
    `Contracts on the line. Stream on Paramount+.`,
  ),
  ev(
    "UFC Fight Night: Hooker vs. Parnasse",
    "2026-09-05T12:00:00",
    3.5,
    "Accor Arena, Paris, France",
    `Main event: Dan Hooker vs. Salahdine Parnasse\nLightweight\n${NOTES.watch}`,
    { extra: { mainEvent: "Hooker vs. Parnasse", card: "Fight Night", city: "Paris" } },
  ),
  ev(
    "Dana White's Contender Series: Season 10, Week 5",
    "2026-09-08T19:00:00",
    2,
    "UFC APEX, Las Vegas, NV",
    `Contracts on the line. Stream on Paramount+.`,
  ),
  ev(
    "Noche UFC: Silva vs. Delgado",
    "2026-09-12T17:00:00",
    4,
    "Desert Diamond Arena, Glendale, AZ",
    `Main event: Jean Silva vs. Jose Delgado\nFeatherweight — Hispanic Heritage celebration card\n${NOTES.watch}`,
    { extra: { mainEvent: "Silva vs. Delgado", card: "Noche UFC", city: "Glendale" } },
  ),
  ev(
    "Dana White's Contender Series: Season 10, Week 6",
    "2026-09-15T19:00:00",
    2,
    "UFC APEX, Las Vegas, NV",
    `Contracts on the line. Stream on Paramount+.`,
  ),
  ev(
    "UFC 331: Van vs. Pantoja 2",
    "2026-09-19T21:00:00",
    5,
    "crypto.com Arena, Los Angeles, CA",
    `Main event: Joshua Van vs. Alexandre Pantoja 2\nFlyweight title\nCo-main: Arman Tsarukyan vs. Mauricio Ruffy\n${NOTES.watch}`,
    { extra: { mainEvent: "Van vs. Pantoja 2", card: "PPV", city: "Los Angeles" } },
  ),
  ev(
    "Dana White's Contender Series: Season 10, Week 7",
    "2026-09-22T19:00:00",
    2,
    "UFC APEX, Las Vegas, NV",
    `Contracts on the line. Stream on Paramount+.`,
  ),
  ev(
    "UFC Fight Night: Rosas Jr. vs. Barcelos",
    "2026-09-26T18:00:00",
    3.5,
    "UFC APEX, Las Vegas, NV",
    `Main event: Raul Rosas Jr. vs. Raoni Barcelos\nBantamweight\n${NOTES.watch}`,
    { extra: { mainEvent: "Rosas Jr. vs. Barcelos", card: "Fight Night", city: "Las Vegas" } },
  ),
  ev(
    "Dana White's Contender Series: Season 10, Week 8",
    "2026-09-29T19:00:00",
    2,
    "UFC APEX, Las Vegas, NV",
    `Contracts on the line. Stream on Paramount+.`,
  ),
  ev(
    "UFC 332",
    "2026-10-03T21:00:00",
    5,
    "Delta Center, Salt Lake City, UT",
    `Numbered PPV in Salt Lake City. Main event TBA.\n${NOTES.watch}`,
    { extra: { card: "PPV", city: "Salt Lake City" } },
  ),
  ev(
    "Dana White's Contender Series: Season 10, Week 9",
    "2026-10-06T19:00:00",
    2,
    "UFC APEX, Las Vegas, NV",
    `Contracts on the line. Stream on Paramount+.`,
  ),
  ev(
    "Dana White's Contender Series: Season 10, Week 10",
    "2026-10-13T19:00:00",
    2,
    "UFC APEX, Las Vegas, NV",
    `Contracts on the line. Stream on Paramount+.`,
  ),
  ev(
    "UFC Fight Night: Buckley vs. Malott",
    "2026-10-17T20:00:00",
    3.5,
    "Rogers Place, Edmonton, AB, Canada",
    `Main event: Joaquin Buckley vs. Mike Malott\nWelterweight\n${NOTES.watch}`,
    { extra: { mainEvent: "Buckley vs. Malott", card: "Fight Night", city: "Edmonton" } },
  ),
  ev(
    "UFC 333: Volkanovski vs. Evloev",
    "2026-10-24T10:00:00",
    5,
    "Etihad Arena, Abu Dhabi, UAE",
    `Main event: Alexander Volkanovski vs. Movsar Evloev\nFeatherweight title\n${NOTES.watch}`,
    { extra: { mainEvent: "Volkanovski vs. Evloev", card: "PPV", city: "Abu Dhabi" } },
  ),
  ev(
    "UFC Fight Night: Las Vegas",
    "2026-10-31T17:00:00",
    3.5,
    "UFC APEX, Las Vegas, NV",
    `Halloween Fight Night at the APEX.\n${NOTES.watch}`,
    { extra: { card: "Fight Night", city: "Las Vegas" } },
  ),
  ev(
    "UFC Fight Night: Bonfim vs. Brady",
    "2026-11-07T17:00:00",
    3.5,
    "UFC APEX, Las Vegas, NV",
    `Main event: Gabriel Bonfim vs. Sean Brady\nWelterweight\n${NOTES.watch}`,
    { extra: { mainEvent: "Bonfim vs. Brady", card: "Fight Night", city: "Las Vegas" } },
  ),
  ev(
    "UFC 334",
    "2026-11-14T17:00:00",
    5,
    "Madison Square Garden, New York, NY",
    `Numbered PPV at Madison Square Garden. Main event TBA.\n${NOTES.watch}`,
    { extra: { card: "PPV", city: "New York" } },
  ),
  ev(
    "UFC 335",
    "2026-12-12T17:00:00",
    5,
    "T-Mobile Arena, Las Vegas, NV",
    `Year-end numbered PPV in Las Vegas. Main event TBA.\n${NOTES.watch}`,
    { extra: { card: "PPV", city: "Las Vegas" } },
  ),
];

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const byDay = new Map<string, SmartEventSpec[]>();
for (const e of UFC_EVENTS) {
  const k = dayKey(e.start);
  const list = byDay.get(k) ?? [];
  list.push(e);
  byDay.set(k, list);
}

export const ufcSmartCalendar: SmartCalendarDefinition = {
  id: "ufc",
  name: "UFC Fights",
  subtitle: "2026 fight nights, PPVs & Contender Series",
  description:
    "Context-aware UFC schedule: numbered events, Fight Nights, and Dana White's Contender Series with venues, main events, and Paramount+ watch info. Overlap warnings fire when you try to book over a card.",
  category: "sports",
  color: "#C8102E",
  account: "Smart Calendars",
  featured: true,
  events: UFC_EVENTS,
  parseBoosts: ["ufc", "fight night", "contender series", "dana white", "ppv"],
  contextHints(isoDate: string) {
    const d = new Date(isoDate);
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const hits = byDay.get(k);
    if (hits?.length) {
      const e = hits[0];
      const extra = e.extra ?? {};
      const main = extra.mainEvent ? ` — ${extra.mainEvent}` : "";
      return `Fight night: ${e.title}${main}. ${e.location ?? ""} · Paramount+`;
    }
    const next = UFC_EVENTS.find((e) => new Date(e.start).getTime() >= d.getTime());
    if (next) {
      const when = new Date(next.start);
      const sameWeek =
        Math.abs(when.getTime() - d.getTime()) < 1000 * 60 * 60 * 24 * 4;
      if (sameWeek) {
        return `Next UFC: ${next.title} · ${when.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`;
      }
    }
    return null;
  },
};

export function nextUfcEvent(from = new Date()) {
  return UFC_EVENTS.find((e) => new Date(e.end).getTime() >= from.getTime()) ?? null;
}

export function ufcConflicts(start: Date, end: Date) {
  return UFC_EVENTS.filter((e) => {
    const a = new Date(e.start).getTime();
    const b = new Date(e.end).getTime();
    return a < end.getTime() && b > start.getTime();
  });
}
