# Fantastical

A full-featured Fantastical clone: natural-language scheduling, calendar sets, and smart calendars (starting with UFC fights).

## Run

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

```bash
npm test    # natural-language parser
npm run build
```

## Using it like Fantastical

Type in the parser the way you would speak:

- `Grocery shopping at Wegmans Thursday at 5pm`
- `Lunch with Sarah at 1pm tomorrow`
- `Soccer practice every Tuesday with John at 6pm`
- `task Final project due Friday!!!`
- `Important meeting at 2pm on Tuesday /work`
- `watch ufc` — fills the next UFC card when that smart calendar is on

Press Return to add. Parsed dates, times, places, people, and calendars highlight as you type.

### Views

Day, Week, Month, Quarter, Year, and Tasks. Shortcuts: `⌘1`–`⌘6`. `T` jumps to today. `N` focuses the parser. Arrow keys step the visible range.

### Calendar sets

Switch sets from the bottom of the sidebar (`Work`, `Personal`, `Sports`, `All Calendars`) or `Ctrl+1`… Drag on the week/day grid to sketch a time, then finish the sentence in the parser.

### Smart calendars

**Add Smart Calendar…** in the sidebar. **UFC Fights** is enabled for the demo: 2026 Fight Nights, numbered events, and Contender Series, with venues, main events, Paramount+ watch notes, and overlap warnings if you book over a card. US Holidays can be toggled the same way.

Appearance: **Fantastical** (dark sidebar + light calendar), Light, or Dark — in Settings.
