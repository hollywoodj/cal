import type { SmartCalendarDefinition, SmartEventSpec } from "../../types";

function allDay(title: string, y: number, m: number, d: number, notes = ""): SmartEventSpec {
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d, 23, 59, 0);
  return {
    title,
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: true,
    notes: notes || "US federal / observed holiday",
  };
}

const Y = 2026;

export const HOLIDAY_EVENTS: SmartEventSpec[] = [
  allDay("New Year's Day", Y, 1, 1),
  allDay("Martin Luther King Jr. Day", Y, 1, 19),
  allDay("Valentine's Day", Y, 2, 14, "Observance"),
  allDay("Presidents' Day", Y, 2, 16),
  allDay("St. Patrick's Day", Y, 3, 17, "Observance"),
  allDay("Easter Sunday", Y, 4, 5, "Observance"),
  allDay("Mother's Day", Y, 5, 10, "Observance"),
  allDay("Memorial Day", Y, 5, 25),
  allDay("Juneteenth", Y, 6, 19),
  allDay("Father's Day", Y, 6, 21, "Observance"),
  allDay("Independence Day", Y, 7, 4),
  allDay("Labor Day", Y, 9, 7),
  allDay("Halloween", Y, 10, 31, "Observance"),
  allDay("Veterans Day", Y, 11, 11),
  allDay("Thanksgiving", Y, 11, 26),
  allDay("Christmas Eve", Y, 12, 24, "Observance"),
  allDay("Christmas Day", Y, 12, 25),
  allDay("New Year's Eve", Y, 12, 31, "Observance"),
];

export const holidaysSmartCalendar: SmartCalendarDefinition = {
  id: "us-holidays",
  name: "US Holidays",
  subtitle: "Federal holidays & observances",
  description: "United States federal holidays and common observances for 2026.",
  category: "holidays",
  color: "#FF3B30",
  account: "Smart Calendars",
  events: HOLIDAY_EVENTS,
  parseBoosts: ["holiday", "thanksgiving", "christmas"],
  contextHints(isoDate: string) {
    const d = new Date(isoDate);
    const hit = HOLIDAY_EVENTS.find((e) => {
      const x = new Date(e.start);
      return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth() && x.getDate() === d.getDate();
    });
    return hit ? `Holiday: ${hit.title}` : null;
  },
};
