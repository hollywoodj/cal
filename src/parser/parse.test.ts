import { describe, expect, it } from "vitest";
import { parseSentence } from "./parse";

const NOW = new Date(2026, 7, 26, 14, 0, 0); // Wed Aug 26 2026 2:00 PM

function parse(s: string) {
  return parseSentence(s, { now: NOW, selectedDate: NOW });
}

describe("Fantastical natural language parser", () => {
  it("parses grocery shopping with location, weekday, and time", () => {
    const p = parse("Grocery shopping at Wegmans Thursday at 5pm");
    expect(p.title).toBe("Grocery shopping");
    expect(p.location).toBe("Wegmans");
    expect(p.allDay).toBe(false);
    expect(p.start?.getDay()).toBe(4);
    expect(p.start?.getDate()).toBe(27);
    expect(p.start?.getHours()).toBe(17);
    expect(p.end?.getHours()).toBe(18);
  });

  it("parses lunch with a person tomorrow", () => {
    const p = parse("Lunch with Sarah at 1pm tomorrow");
    expect(p.title).toBe("Lunch");
    expect(p.invitees).toEqual(["Sarah"]);
    expect(p.start?.getDate()).toBe(27);
    expect(p.start?.getHours()).toBe(13);
  });

  it("parses a multi-day vacation range", () => {
    const p = parse("Family vacation from August 9-18");
    expect(p.title).toBe("Family vacation");
    expect(p.allDay).toBe(true);
    expect(p.start?.getMonth()).toBe(7);
    expect(p.start?.getDate()).toBe(9);
    expect(p.end?.getDate()).toBe(18);
  });

  it("parses a yearly birthday", () => {
    const p = parse("Sam's birthday every year on 5/16");
    expect(p.title).toBe("Sam's birthday");
    expect(p.recurrence?.freq).toBe("yearly");
    expect(p.recurrence?.byMonth).toBe(5);
    expect(p.recurrence?.byMonthDay).toBe(16);
    expect(p.allDay).toBe(true);
  });

  it("parses repeating weekday practices", () => {
    const p = parse("Soccer practice every Tuesday with John at 6pm");
    expect(p.title).toBe("Soccer practice");
    expect(p.invitees).toEqual(["John"]);
    expect(p.recurrence?.freq).toBe("weekly");
    expect(p.recurrence?.byWeekday).toEqual([2]);
    expect(p.start?.getHours()).toBe(18);
  });

  it("parses two weekdays and a time range with a from/to window", () => {
    const p = parse("Piano lessons Tuesdays and Thursdays at 5-6pm from 1/21 to 2/23");
    expect(p.title).toBe("Piano lessons");
    expect(p.recurrence?.byWeekday).toEqual([2, 4]);
    expect(p.start?.getHours()).toBe(17);
    expect(p.end?.getHours()).toBe(18);
    expect(p.recurrence?.until).toBeTruthy();
  });

  it("parses lunch every Tuesday until a date", () => {
    const p = parse("Lunch every Tuesday until 2/5");
    expect(p.title).toBe("Lunch");
    expect(p.recurrence?.freq).toBe("weekly");
    expect(p.recurrence?.until).toBeTruthy();
  });

  it("creates a task from a due date sentence", () => {
    const p = parse("task Final project due August 15");
    expect(p.isTask).toBe(true);
    expect(p.title).toContain("Final project");
    expect(p.start?.getMonth()).toBe(7);
    expect(p.start?.getDate()).toBe(15);
  });

  it("creates a high-priority todo", () => {
    const p = parse("todo Finish important task by Thursday!!!");
    expect(p.isTask).toBe(true);
    expect(p.priority).toBe(3);
    expect(p.title).toMatch(/Finish important task/i);
    expect(p.start?.getDay()).toBe(4);
  });

  it("parses haircut with location, time, and alert", () => {
    const p = parse("Haircut tomorrow at Quick Cuts 10am alert 30 minutes");
    expect(p.title).toBe("Haircut");
    expect(p.location).toBe("Quick Cuts");
    expect(p.start?.getDate()).toBe(27);
    expect(p.start?.getHours()).toBe(10);
    expect(p.alertMinutes).toBe(30);
  });

  it("routes an event to a calendar with a slash shortcut", () => {
    const p = parse("Important meeting at 2pm on Tuesday /work");
    expect(p.title).toBe("Important meeting");
    expect(p.calendarQuery).toBe("work");
    expect(p.start?.getHours()).toBe(14);
    expect(p.start?.getDay()).toBe(2);
  });

  it("keeps confusing title words when quoted", () => {
    const p = parse('"Prepare for Wacky Wednesday" on Tuesday at 9pm');
    expect(p.title).toBe("Prepare for Wacky Wednesday");
    expect(p.start?.getDay()).toBe(2);
    expect(p.start?.getHours()).toBe(21);
  });

  it("parses colon weekly recurrence", () => {
    const p = parse("coffee w/ Shawn tomorrow 7am :weekly");
    expect(p.recurrence?.freq).toBe("weekly");
    expect(p.start?.getHours()).toBe(7);
    expect(p.start?.getDate()).toBe(27);
  });

  it("parses the 2nd Friday of every month", () => {
    const p = parse("Pizza party on the 2nd Friday of every month at 1pm");
    expect(p.recurrence?.freq).toBe("monthly");
    expect(p.recurrence?.bySetPos).toBe(2);
    expect(p.recurrence?.byWeekday).toEqual([5]);
    expect(p.start?.getHours()).toBe(13);
  });

  it("treats 1-7 without am/pm as PM", () => {
    const p = parse("Call bank Thursday at 5");
    expect(p.start?.getHours()).toBe(17);
  });

  it("treats 8-11 without am/pm as AM", () => {
    const p = parse("Standup tomorrow at 9");
    expect(p.start?.getHours()).toBe(9);
  });

  it("parses noon and midnight", () => {
    expect(parse("Lunch tomorrow noon").start?.getHours()).toBe(12);
    expect(parse("Deadline tonight midnight").start?.getHours()).toBe(0);
  });

  it("parses duration", () => {
    const p = parse("Deep work tomorrow at 9am for 2 hours");
    expect(p.end?.getHours()).toBe(11);
    expect(p.durationMinutes).toBe(120);
  });

  it("parses urls", () => {
    const p = parse("Design review tomorrow 3pm https://zoom.us/j/123");
    expect(p.url).toContain("zoom.us");
  });

  it("defaults all-day when no time is given", () => {
    const p = parse("Company offsite Friday");
    expect(p.allDay).toBe(true);
    expect(p.start?.getDay()).toBe(5);
  });

  it("highlights tokens for the live preview", () => {
    const p = parse("Dinner with Alex at Balthazar Friday 7:30pm /home");
    const kinds = p.tokens.map((t) => t.kind);
    expect(kinds).toContain("person");
    expect(kinds).toContain("location");
    expect(kinds).toContain("date");
    expect(kinds).toContain("time");
    expect(kinds).toContain("calendar");
  });
});
