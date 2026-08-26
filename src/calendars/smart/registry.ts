import type { SmartCalendarDefinition } from "../../types";
import { holidaysSmartCalendar } from "./holidays";
import { ufcSmartCalendar } from "./ufc";

export const SMART_CALENDARS: SmartCalendarDefinition[] = [
  ufcSmartCalendar,
  holidaysSmartCalendar,
];

export function getSmartCalendar(id: string) {
  return SMART_CALENDARS.find((c) => c.id === id);
}
