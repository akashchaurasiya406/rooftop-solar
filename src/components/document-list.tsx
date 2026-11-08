import { cx } from "@/components/ui";

export interface DocItem {
  id: string;
  title: string;
  fileMime: string;
  fileSize: number;
  when: string;
}

export const toDocItem = (d: { id: string; title: string; fileMime: string; fileSize: number; createdAt: Date }, locale: string): DocItem => ({
  id: d.id,
  title: d.title,
  fileMime: d.fileMime,
  fileSize: d.fileSize,
  when: d.createdAt.toLocaleString(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }),
});

export function DocumentList({ docs, empty }: { docs: DocItem[]; empty: string }) {
  if (docs.length === 0) return empty ? <p className="mt-3 text-sm text-muted">{empty}</p> : null;
  return (
    <ul className="mt-3 divide-y divide-line">
      {docs.map((d, i) => (
        <li key={d.id} className="animate-[rise_0.5s_var(--ease-out-soft)_both]" style={{ animationDelay: `${150 + Math.min(i, 6) * 80}ms` }}>
          <a
            href={`/api/documents/${d.id}`}
            target="_blank"
            rel="noopener"
            className="group flex items-center gap-3 py-2.5 text-sm transition-colors hover:text-brand"
          >
            <span
              className={cx(
                "grid size-8 shrink-0 place-items-center rounded-lg text-[10px] font-semibold uppercase",
                d.fileMime === "application/pdf" ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand",
              )}
            >
              {d.fileMime === "application/pdf" ? "PDF" : "IMG"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{d.title}</span>
              <span className="num block text-[12px] text-muted">
                {d.when} · {Math.max(1, Math.round(d.fileSize / 1024))} KB
              </span>
            </span>
            <span aria-hidden className="text-muted transition-transform duration-300 group-hover:translate-x-1">
              ↗
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
