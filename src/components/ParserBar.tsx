import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useCal } from "../state/store";
import { formatParseSummary } from "../parser/parse";
import type { TokenKind } from "../types";

export function ParserBar() {
  const parserPrefill = useCal((s) => s.parserPrefill);
  const parse = useCal((s) => s.parse);
  const commitParse = useCal((s) => s.commitParse);
  const calendars = useCal((s) => s.calendars);
  const overlapWarning = useCal((s) => s.overlapWarning);
  const closeParser = useCal((s) => s.closeParser);
  const [text, setText] = useState(parserPrefill);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(parserPrefill);
    if (parserPrefill) inputRef.current?.focus();
  }, [parserPrefill]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const parsed = useMemo(() => (text.trim() ? parse(text) : null), [text, parse]);
  const cal =
    calendars.find(
      (c) =>
        parsed?.calendarQuery &&
        c.name.toLowerCase().startsWith(parsed.calendarQuery.toLowerCase()),
    ) ?? calendars.find((c) => c.id === useCal.getState().defaultCalendarId());

  const warn =
    parsed &&
    parsed.start &&
    parsed.end &&
    !parsed.isTask &&
    !(parsed.calendarQuery || "").toLowerCase().includes("ufc") &&
    !/ufc|fight night|watch the fight/i.test(text)
      ? overlapWarning(parsed.start, parsed.end)
      : null;

  return (
    <div className="parser">
      <div className="parser-field">
        <Plus className="parser-plus" size={16} />
        <div className="parser-highlight" aria-hidden>
          {text ? <Highlighted text={text} tokens={parsed?.tokens ?? []} /> : <span style={{ color: "var(--main-muted)" }}>Type an event or task… “Lunch with Sarah at 1pm tomorrow”</span>}
        </div>
        <textarea
          ref={inputRef}
          className="parser-input"
          value={text}
          spellCheck={false}
          rows={1}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!text.trim()) return;
              commitParse(text);
              setText("");
              closeParser();
            }
            if (e.key === "Escape") {
              setText("");
              closeParser();
            }
          }}
          placeholder=""
        />
      </div>
      {parsed && text.trim() && (
        <div className="preview-card">
          <div className="swatch" style={{ background: cal?.color ?? "#007AFF" }} />
          <div>
            <h4>
              {parsed.isTask ? "Task · " : ""}
              {parsed.title}
            </h4>
            <p>{formatParseSummary(parsed)}</p>
            {parsed.location && <p>{parsed.location}</p>}
            {parsed.invitees.length > 0 && <p>With {parsed.invitees.join(", ")}</p>}
            {parsed.recurrence && <p>Repeats {parsed.recurrence.freq}</p>}
            {parsed.calendarQuery && <p>Calendar: {cal?.name ?? parsed.calendarQuery}</p>}
          </div>
          <div style={{ fontSize: 11, color: "var(--main-muted)", alignSelf: "center" }}>
            ⏎ Add
          </div>
          {warn && <div className="preview-warn">{warn}</div>}
        </div>
      )}
    </div>
  );
}

function Highlighted({ text, tokens }: { text: string; tokens: { start: number; end: number; kind: TokenKind }[] }) {
  const sorted = [...tokens].sort((a, b) => a.start - b.start);
  const parts: { t: string; kind?: TokenKind }[] = [];
  let i = 0;
  for (const tok of sorted) {
    if (tok.start > i) parts.push({ t: text.slice(i, tok.start) });
    parts.push({ t: text.slice(tok.start, tok.end), kind: tok.kind });
    i = tok.end;
  }
  if (i < text.length) parts.push({ t: text.slice(i) });
  return (
    <>
      {parts.map((p, idx) =>
        p.kind ? (
          <span key={idx} className={`tok-${p.kind}`}>
            {p.t}
          </span>
        ) : (
          <span key={idx}>{p.t}</span>
        ),
      )}
    </>
  );
}
