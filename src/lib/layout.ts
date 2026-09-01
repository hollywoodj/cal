import type { CalEvent } from "../types";
import { fromISO, minutesFromMidnight } from "./dates";

export interface LaidOutEvent {
  event: CalEvent;
  col: number;
  cols: number;
  top: number;
  height: number;
}

export function layoutDayEvents(events: CalEvent[], hourHeight: number): LaidOutEvent[] {
  const timed = events
    .filter((e) => !e.allDay)
    .map((event) => {
      const start = fromISO(event.start);
      const end = fromISO(event.end);
      const startMin = minutesFromMidnight(start);
      const endMin = Math.max(startMin + 15, minutesFromMidnight(end) || startMin + 60);
      return { event, startMin, endMin };
    })
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  const items: (typeof timed[number] & { col: number; cols: number })[] = [];
  const clusters: typeof timed[] = [];
  let cluster: typeof timed = [];
  let clusterEnd = -1;

  for (const ev of timed) {
    if (!cluster.length || ev.startMin < clusterEnd) {
      cluster.push(ev);
      clusterEnd = Math.max(clusterEnd, ev.endMin);
    } else {
      clusters.push(cluster);
      cluster = [ev];
      clusterEnd = ev.endMin;
    }
  }
  if (cluster.length) clusters.push(cluster);

  for (const group of clusters) {
    const colEnd: number[] = [];
    const assigned = group.map((ev) => {
      let col = 0;
      while (colEnd[col] !== undefined && ev.startMin < colEnd[col]) col++;
      colEnd[col] = ev.endMin;
      return { ...ev, col, cols: 0 };
    });
    const cols = Math.max(1, ...assigned.map((a) => a.col + 1));
    for (const a of assigned) {
      a.cols = cols;
      items.push(a);
    }
  }

  return items.map((it) => ({
    event: it.event,
    col: it.col,
    cols: it.cols,
    top: (it.startMin / 60) * hourHeight,
    height: Math.max(18, ((it.endMin - it.startMin) / 60) * hourHeight),
  }));
}
