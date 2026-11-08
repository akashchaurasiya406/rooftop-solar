export function fill(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] === undefined ? "" : String(vars[k])));
}

export function agoText(d: Date, t: { today: string; yesterday: string; daysAgo: string }, now = Date.now()): string {
  const days = Math.floor((now - d.getTime()) / 86_400_000);
  if (days <= 0) return t.today;
  if (days === 1) return t.yesterday;
  return fill(t.daysAgo, { n: days });
}
