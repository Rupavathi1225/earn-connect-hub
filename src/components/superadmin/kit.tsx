import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* primitives                                                          */
/* ------------------------------------------------------------------ */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-[var(--sa-border)] bg-[var(--sa-card)] p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[13px] font-semibold text-[var(--sa-text)]">{children}</h2>
      {right}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = "var(--sa-accent)",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--sa-border)] bg-[var(--sa-card)] p-4">
      <div className="text-[22px] font-bold" style={{ color: accent }}>
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--sa-muted)]">{label}</div>
      {hint ? <div className="mt-1 text-[10px] text-[var(--sa-muted)]">{hint}</div> : null}
    </div>
  );
}

const BADGE_TONES: Record<string, string> = {
  green: "bg-emerald-500/15 text-emerald-400",
  red: "bg-red-500/15 text-red-400",
  yellow: "bg-amber-500/15 text-amber-400",
  blue: "bg-blue-500/15 text-blue-400",
  purple: "bg-violet-500/15 text-violet-400",
  gray: "bg-slate-500/15 text-slate-400",
};

export function toneFor(status?: string | null) {
  const s = (status ?? "").toLowerCase();
  if (["approved", "active", "success", "paid", "ok", "healthy", "info", "released", "enabled"].includes(s))
    return "green";
  if (["pending", "running", "warn", "warning", "queued", "in_progress"].includes(s)) return "yellow";
  if (["rejected", "failed", "error", "critical", "banned", "suspended", "disabled"].includes(s)) return "red";
  if (["draft", "idle", "not_configured"].includes(s)) return "gray";
  return "blue";
}

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const t = tone ?? toneFor(String(children));
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${BADGE_TONES[t] ?? BADGE_TONES.blue}`}>
      {children}
    </span>
  );
}

const BTN: Record<string, string> = {
  blue: "bg-blue-600 text-white hover:bg-blue-500",
  green: "bg-emerald-600 text-white hover:bg-emerald-500",
  red: "bg-red-600 text-white hover:bg-red-500",
  purple: "bg-violet-600 text-white hover:bg-violet-500",
  orange: "bg-amber-500 text-white hover:bg-amber-400",
  dark: "border border-[var(--sa-border)] bg-[var(--sa-input)] text-[var(--sa-soft)] hover:brightness-125",
};

export function Btn({
  children,
  tone = "blue",
  onClick,
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof BTN;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-3.5 py-1.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${BTN[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className="relative inline-block h-[19px] w-[36px] rounded-full transition"
      style={{ background: on ? "var(--sa-green)" : "#4b5063" }}
    >
      <span
        className="absolute top-[1.5px] h-4 w-4 rounded-full bg-white transition-all"
        style={{ left: on ? 18 : 2 }}
      />
    </button>
  );
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[10px] font-medium text-[var(--sa-muted)]">{label}</label>
      {children}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`max-h-[85vh] w-full overflow-y-auto rounded-xl border border-[var(--sa-border)] bg-[var(--sa-card)] p-5 ${wide ? "max-w-3xl" : "max-w-lg"}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--sa-text)]">{title}</h3>
          <button onClick={onClose} className="text-[var(--sa-muted)] hover:text-[var(--sa-text)]">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmButton({
  children,
  message,
  onConfirm,
  tone = "red",
}: {
  children: ReactNode;
  message: string;
  onConfirm: () => void;
  tone?: keyof typeof BTN;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn tone={tone} onClick={() => setOpen(true)}>
        {children}
      </Btn>
      {open && (
        <Modal title="Please confirm" onClose={() => setOpen(false)}>
          <p className="mb-5 text-xs text-[var(--sa-soft)]">{message}</p>
          <div className="flex justify-end gap-2">
            <Btn tone="dark" onClick={() => setOpen(false)}>
              Cancel
            </Btn>
            <Btn
              tone={tone}
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              Confirm
            </Btn>
          </div>
        </Modal>
      )}
    </>
  );
}

export function CopyBox({ value, label }: { value: string; label?: string }) {
  return (
    <div className="relative rounded-md border border-[var(--sa-border)] bg-[var(--sa-input)] p-3 pr-20 font-mono text-[11px] leading-relaxed break-all text-[var(--sa-accent)]">
      {label ? <div className="mb-1 font-sans text-[10px] text-[var(--sa-muted)]">{label}</div> : null}
      {value}
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value);
          toast.success("Copied to clipboard");
        }}
        className="absolute right-2 top-2 rounded bg-blue-600 px-2.5 py-1 font-sans text-[10px] text-white"
      >
        Copy
      </button>
    </div>
  );
}

export function Empty({ children = "Nothing here yet." }: { children?: ReactNode }) {
  return (
    <div className="py-10 text-center text-xs text-[var(--sa-muted)]">{children}</div>
  );
}

export function Loading() {
  return <div className="py-10 text-center text-xs text-[var(--sa-muted)]">Loading…</div>;
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
      {error instanceof Error ? error.message : "Something went wrong."}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* data table                                                          */
/* ------------------------------------------------------------------ */

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  value?: (row: T) => string | number | null | undefined;
  sortable?: boolean;
  className?: string;
};

export function exportRows(filename: string, headers: string[], rows: (string | number)[][], kind: "csv" | "xls" | "pdf") {
  if (kind === "pdf") {
    const html = `<html><head><title>${filename}</title><style>body{font-family:sans-serif;font-size:11px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:5px;text-align:left}th{background:#eee}</style></head><body><h3>${filename}</h3><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${String(c ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
    return;
  }
  let blob: Blob;
  if (kind === "xls") {
    const html = `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${String(c ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    blob = new Blob([html], { type: "application/vnd.ms-excel" });
  } else {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.${kind === "xls" ? "xls" : "csv"}`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DataTable<T extends Record<string, unknown>>({
  rows,
  columns,
  searchable = true,
  pageSize = 10,
  exportName,
  exportFormats = ["csv"],
  empty,
  toolbar,
}: {
  rows: T[];
  columns: Column<T>[];
  searchable?: boolean;
  pageSize?: number;
  exportName?: string;
  exportFormats?: ("csv" | "xls" | "pdf")[];
  empty?: ReactNode;
  toolbar?: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const cellValue = (row: T, col: Column<T>) =>
    col.value ? col.value(row) : (row[col.key] as string | number | null | undefined);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows;
    if (needle) {
      out = rows.filter((r) =>
        columns.some((c) => String(cellValue(r, c) ?? "").toLowerCase().includes(needle)),
      );
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        out = [...out].sort((a, b) => {
          const av = cellValue(a, col);
          const bv = cellValue(b, col);
          if (typeof av === "number" && typeof bv === "number") return (av - bv) * sort.dir;
          return String(av ?? "").localeCompare(String(bv ?? "")) * sort.dir;
        });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, sort, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const slice = filtered.slice(current * pageSize, current * pageSize + pageSize);

  function doExport(kind: "csv" | "xls" | "pdf") {
    exportRows(
      exportName ?? "export",
      columns.map((c) => c.header),
      filtered.map((r) => columns.map((c) => String(cellValue(r, c) ?? ""))),
      kind,
    );
  }

  return (
    <div>
      {(searchable || exportName || toolbar) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {searchable && (
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Search…"
              className="!w-56"
            />
          )}
          {toolbar}
          <div className="ml-auto flex gap-2">
            {exportName &&
              exportFormats.map((f) => (
                <Btn key={f} tone="dark" onClick={() => doExport(f)}>
                  {f.toUpperCase()}
                </Btn>
              ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-[var(--sa-border)]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() =>
                    c.sortable === false
                      ? undefined
                      : setSort((s) =>
                          s && s.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 },
                        )
                  }
                  className={`whitespace-nowrap bg-[var(--sa-input)] px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-[var(--sa-accent)] ${c.sortable === false ? "" : "cursor-pointer select-none"}`}
                >
                  {c.header}
                  {sort?.key === c.key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={(row.id as string) ?? i} className="border-t border-[var(--sa-border)]">
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 py-2.5 text-[11px] text-[var(--sa-soft)] ${c.className ?? ""}`}>
                    {c.render ? c.render(row) : String(cellValue(row, c) ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={columns.length}>{empty ?? <Empty />}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--sa-muted)]">
          <span>
            {current * pageSize + 1}–{Math.min(filtered.length, (current + 1) * pageSize)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <Btn tone="dark" disabled={current === 0} onClick={() => setPage(current - 1)}>
              Prev
            </Btn>
            <span className="px-2 py-1.5">
              {current + 1} / {pages}
            </span>
            <Btn tone="dark" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
              Next
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
