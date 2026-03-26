import { RotateCcw, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { QueueItem, SortKey } from "@/api/queueApi";

function fmt(iso?: string) {
  if (!iso) return <span className="text-muted-foreground/40">—</span>;
  const d = new Date(iso);
  if (isNaN(d.getTime()) || d.getFullYear() <= 1) return <span className="text-muted-foreground/40">—</span>;
  return (
    <span className="whitespace-nowrap">
      <span>{d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })}</span>
      {" "}
      <span>{d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
    </span>
  );
}

interface Props {
  items: QueueItem[];
  isLoading: boolean;
  error: Error | null;
  page: number;
  pageSize: number;
  totalItems: number;
  sortKey: SortKey | null;
  sortDir: "asc" | "desc";
  onPageChange: (page: number) => void;
  onSort: (key: SortKey | null, dir: "asc" | "desc") => void;
}

const cols: { key: SortKey; label: string; className?: string }[] = [
  { key: "name", label: "File" },
  { key: "status", label: "Status" },
  { key: "totalProgress", label: "Progress", className: "w-36" },
  { key: "fileSize", label: "Size" },
  { key: "inQueueSince", label: "Queued At" },
  { key: "started", label: "Started at" },
  { key: "ended", label: "Ended at" },
  { key: "lastAttempt", label: "Last Attempt at" },
];

export function QueueTable({
  items,
  isLoading,
  error,
  page,
  pageSize,
  totalItems,
  sortKey,
  sortDir,
  onPageChange,
  onSort,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      if (sortDir === "asc") onSort(key, "desc");
      else onSort(null, "asc");
    } else {
      onSort(key, "asc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive font-mono">
        Loading error: {error.message}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-xs text-muted-foreground font-mono">
            Page {page + 1} of {totalPages} ({page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalItems)} of {totalItems})
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {cols.map(c => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className={`px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none group hover:text-foreground transition-colors ${c.className ?? ""}`}
                >
                  <span className="flex items-center gap-1.5">
                    {c.label}
                    <SortIcon col={c.key} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Error</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: pageSize }, (_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {Array.from({ length: 10 }, (_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground font-mono text-sm">
                  No files
                </td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-mono text-xs text-foreground truncate max-w-[200px]">{item.fileName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">ID: {item.mediaItemId}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {(item.status === "failed" || item.status === "waitingForProcessAfterFail") && item.error ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help"><StatusBadge status={item.status} /></span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs font-mono text-xs bg-destructive/90 text-destructive-foreground border-destructive/50">
                          {item.error}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <StatusBadge status={item.status} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={item.progress} className="h-1.5 flex-1" />
                      <span className="font-mono text-xs text-muted-foreground w-8 text-right">{item.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground">{item.fileSize}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground">{fmt(item.queuedAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground">{fmt(item.startedAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground">{fmt(item.completedAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground">{fmt(item.lastAttempt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {item.error ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-mono text-xs text-destructive truncate max-w-[200px] block cursor-help">{item.error}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm font-mono text-xs bg-destructive/90 text-destructive-foreground border-destructive/50">
                          {item.error}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {(item.status === "failed" || item.status === "waitingForProcessAfterFail") && (
                      <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Retry">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
