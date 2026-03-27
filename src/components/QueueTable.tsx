import { useState } from "react";
import { RotateCcw, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, ImageOff } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PARENT_BASE } from "@/lib/config";
import type { QueueItem, SortKey } from "@/api/queueApi";

function getThumbUrl(guid: string): string {
  const g = guid.toLowerCase();
  return `${PARENT_BASE}/thumb/${g[0]}/${g[1]}${g[2]}/${g}-s.jpg`;
}

function ThumbPreview({ guid }: { guid: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-12 h-12 rounded border border-border bg-muted flex items-center justify-center">
        <ImageOff className="h-4 w-4 text-muted-foreground/50" />
      </div>
    );
  }
  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <img
          src={getThumbUrl(guid)}
          alt="preview"
          className="w-12 h-12 rounded border border-border object-cover bg-muted cursor-pointer"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-auto p-1">
        <img
          src={getThumbUrl(guid).replace("-s.jpg", "-m.jpg")}
          alt="full preview"
          className="max-w-[400px] max-h-[400px] rounded object-contain bg-muted"
        />
      </HoverCardContent>
    </HoverCard>
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

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const cols: { key: SortKey | null; label: string; className?: string }[] = [
  { key: "name", label: "File" },
  { key: null, label: "Status" },
  { key: "totalProgress", label: "Progress", className: "w-32" },
  { key: "fileSize", label: "Size" },
  { key: "inQueueSince", label: "Queued" },
  { key: "started", label: "Started" },
  { key: "ended", label: "Completed" },
  { key: "lastAttempt", label: "Last Attempt" },
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
    <div className="rounded-lg bg-card overflow-hidden">
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-xs text-muted-foreground font-mono">
            Page {page + 1} of {totalPages} ({page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalItems)} of {totalItems})
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile card view */}
      <div className="block md:hidden divide-y divide-border">
        {isLoading ? (
          Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-1.5 w-full" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground font-mono text-sm">
            No files
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="p-4 space-y-2">
              <div className="flex items-start gap-3">
                <ThumbPreview guid={item.id} />
                <div className="flex-1 min-w-0">
                  <a
                    href={`${PARENT_BASE}/?open=${item.mediaItemId}`}
                    className="font-mono text-xs text-primary hover:underline truncate block"
                  >
                    {item.fileName}
                  </a>
                  <p className="text-[10px] text-muted-foreground font-mono">ID: {item.mediaItemId}</p>
                  <div className="mt-1">
                    <StatusBadge status={item.status} queuedAt={item.queuedAt} startedAt={item.startedAt} completedAt={item.completedAt} lastAttempt={item.lastAttempt} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={item.progress} className="h-1.5 flex-1" />
                <span className="font-mono text-xs text-muted-foreground w-8 text-right">{item.progress}%</span>
                <span className="font-mono text-xs text-muted-foreground">{item.fileSize}</span>
              </div>
              {item.error && (
                <p className="font-mono text-[10px] text-destructive truncate">{item.error}</p>
              )}
              {(item.status === "failed" || item.status === "waitingForProcessAfterFail") && (
                <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Retry">
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-3 w-16"></th>
              {cols.map(c => (
                <th
                  key={c.key ?? c.label}
                  onClick={c.key ? () => toggleSort(c.key!) : undefined}
                  className={`px-4 py-3 text-left font-medium text-muted-foreground select-none transition-colors ${c.key ? "cursor-pointer group hover:text-foreground" : ""} ${c.className ?? ""}`}
                >
                  <span className="flex items-center gap-1.5">
                    {c.label}
                    {c.key && <SortIcon col={c.key} />}
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
                  <td className="px-4 py-3"><Skeleton className="h-10 w-10 rounded" /></td>
                  {Array.from({ length: 6 }, (_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground font-mono text-sm">
                  No files
                </td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                  <td className="px-3 py-2">
                    <ThumbPreview guid={item.id} />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <a
                        href={`${PARENT_BASE}/?open=${item.mediaItemId}`}
                        className="font-mono text-xs text-primary hover:underline truncate max-w-[200px] block"
                      >
                        {item.fileName}
                      </a>
                      <p className="text-[10px] text-muted-foreground font-mono">ID: {item.mediaItemId}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {(item.status === "failed" || item.status === "waitingForProcessAfterFail") && item.error ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            <StatusBadge status={item.status} queuedAt={item.queuedAt} startedAt={item.startedAt} completedAt={item.completedAt} lastAttempt={item.lastAttempt} />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs font-mono text-xs bg-destructive/90 text-destructive-foreground border-destructive/50">
                          {item.error}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <StatusBadge status={item.status} queuedAt={item.queuedAt} startedAt={item.startedAt} completedAt={item.completedAt} lastAttempt={item.lastAttempt} />
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
