import { format, isSameDay, startOfDay } from "date-fns";
import { useCal } from "../state/store";
import { fromISO } from "../lib/dates";

export function TaskView() {
  const tasks = useCal((s) => s.tasks);
  const toggleTask = useCal((s) => s.toggleTask);
  const deleteTask = useCal((s) => s.deleteTask);
  const openParser = useCal((s) => s.openParser);
  const calendars = useCal((s) => s.calendars);

  const groups = groupTasks(tasks);

  return (
    <div className="task-view">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Tasks</h2>
        <button className="primary" onClick={() => openParser("task ")}>
          New Task
        </button>
      </div>
      {groups.map((g) => (
        <section key={g.label}>
          <h3 className="event-list" style={{ color: "var(--main-muted)", fontSize: 11 }}>
            {g.label}
          </h3>
          {g.items.map((t) => {
            const cal = calendars.find((c) => c.id === t.listId);
            return (
              <div key={t.id} className={`task-row ${t.completed ? "done" : ""}`}>
                <button
                  className="check"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: `2px solid ${cal?.color ?? "#8e8e93"}`,
                    background: t.completed ? cal?.color : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleTask(t.id)}
                />
                <div style={{ flex: 1 }}>
                  <div className="title">
                    {t.priority > 0 && <span className="prio">{"!".repeat(t.priority)} </span>}
                    {t.title}
                  </div>
                  {t.due && <div className="due">{format(fromISO(t.due), "EEE, MMM d · h:mm a")}</div>}
                </div>
                <button className="ghost" onClick={() => deleteTask(t.id)}>
                  Delete
                </button>
              </div>
            );
          })}
        </section>
      ))}
      {tasks.length === 0 && <div className="empty">No tasks. Type “task …” in the parser.</div>}
    </div>
  );
}

function groupTasks(tasks: ReturnType<typeof useCal.getState>["tasks"]) {
  const today = startOfDay(new Date());
  const buckets: { label: string; items: typeof tasks }[] = [
    { label: "OVERDUE", items: [] },
    { label: "TODAY", items: [] },
    { label: "UPCOMING", items: [] },
    { label: "SOMEDAY", items: [] },
    { label: "COMPLETED", items: [] },
  ];
  for (const t of tasks) {
    if (t.completed) {
      buckets[4].items.push(t);
      continue;
    }
    if (!t.due) {
      buckets[3].items.push(t);
      continue;
    }
    const d = startOfDay(fromISO(t.due));
    if (d < today) buckets[0].items.push(t);
    else if (isSameDay(d, today)) buckets[1].items.push(t);
    else buckets[2].items.push(t);
  }
  return buckets.filter((b) => b.items.length);
}
