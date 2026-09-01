export const APPLE_CALENDAR_COLORS = {
  red: "#FF3B30",
  orange: "#FF9500",
  yellow: "#FFCC00",
  green: "#34C759",
  mint: "#00C7BE",
  teal: "#30B0C7",
  cyan: "#32ADE6",
  blue: "#007AFF",
  indigo: "#5856D6",
  purple: "#AF52DE",
  pink: "#FF2D55",
  brown: "#A2845E",
  gray: "#8E8E93",
} as const;

export function contrastText(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma > 0.62 ? "#1d1d1f" : "#ffffff";
}

export function withAlpha(hex: string, alpha: number) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function darken(hex: string, amount = 0.12) {
  const c = hex.replace("#", "");
  const r = Math.round(parseInt(c.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(c.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(c.slice(4, 6), 16) * (1 - amount));
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
