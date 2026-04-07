import { useState, useRef, useEffect, useCallback } from "react";
import { RotateCcw, ImageOff, ArrowUp, ArrowDown, ArrowUpDown, AlertCircle, ChevronsUp, Loader2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDetailDialog } from "./ErrorDetailDialog";
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
  totalItems: number;
  isFetchingMore: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  sortBy: SortKey | null;
  sortOrder: 0 | 1;
  onSort: (key: SortKey) => void;
}

const sortableCols: Record<string, SortKey | null> = {
  File: "name",
  Type: null,
  Status: null,
  Progress: null,
  Size: "fileSize",
};

const cols = ["File", "Type", "Status", "Progress", "Size"];

function splitFileName(name: string): { baseName: string; ext: string } {
  const dotIdx = name.lastIndexOf(".");
  if (dotIdx <= 0) return { baseName: name, ext: "" };
  return { baseName: name.substring(0, dotIdx), ext: name.substring(dotIdx + 1).toUpperCase() };
}

export function QueueTable({
  items,
  isLoading,
  error,
  totalItems,
  isFetchingMore,
  onLoadMore,
  hasMore,
  sortBy,
  sortOrder,
  onSort,
}: Props) {
  const [errorDialogItem, setErrorDialogItem] = useState<QueueItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { root: container, rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore]);

  // Track scroll position for "scroll to top" button
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollTop(el.scrollTop > 300);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive font-mono">
        Loading error: {error.message}
      </div>
    );
  }

  const loadingIndicator = isFetchingMore ? (
    <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-xs font-mono">Loading…</span>
    </div>
  ) : null;


  return (
    <div className="rounded-lg bg-card overflow-hidden flex flex-col h-full relative">

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Mobile card view */}
        <div className="block md:hidden divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 8 }, (_, i) => (
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
            <>
              {items.map(item => (
                <div key={item.id} className="p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <ThumbPreview guid={item.id} />
                    <div className="flex-1 min-w-0">
                      <a
                        href={`${PARENT_BASE}/?open=${item.mediaItemId}`}
                        className="font-mono text-xs text-primary hover:underline truncate block"
                      >
                        {splitFileName(item.fileName).baseName}
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
                    <button
                      onClick={() => setErrorDialogItem(item)}
                      className="flex items-center gap-1 font-mono text-[10px] text-destructive hover:underline truncate"
                    >
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span className="truncate">{item.error}</span>
                    </button>
                  )}
                </div>
              ))}
              {loadingIndicator}
              <div ref={sentinelRef} className="h-1" />
            </>
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-card">
                <th className="px-3 py-3 w-[60px]"></th>
                {cols.map(label => {
                  const sortKey = sortableCols[label];
                  const isActive = sortKey && sortBy === sortKey;
                  return (
                    <th
                      key={label}
                      className={`px-4 py-3 font-medium text-muted-foreground ${label === "Progress" ? "w-36" : ""} ${label === "Size" ? "text-right" : "text-left"} ${sortKey ? "cursor-pointer select-none hover:text-foreground transition-colors" : ""}`}
                      onClick={sortKey ? () => onSort(sortKey) : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {sortKey && (
                          isActive
                            ? sortOrder === 0
                              ? <ArrowUp className="h-3 w-3" />
                              : <ArrowDown className="h-3 w-3" />
                            : <ArrowUpDown className="h-3 w-3 opacity-30" />
                        )}
                      </span>
                    </th>
                  );
                })}
                <th className="px-4 py-3 text-left font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }, (_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-4 py-3"><Skeleton className="h-10 w-10 rounded" /></td>
                    {Array.from({ length: 5 }, (_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                    <td className="px-4 py-3"></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground font-mono text-sm">
                    No files
                  </td>
                </tr>
              ) : (
                <>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                      <td className="px-3 py-2">
                        <ThumbPreview guid={item.id} />
                      </td>
                      <td className="px-4 py-3 max-w-[450px]">
                        <div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={`${PARENT_BASE}/?open=${item.mediaItemId}`}
                                className="font-mono text-xs text-primary hover:underline truncate block"
                              >
                                {splitFileName(item.fileName).baseName}
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-md font-mono text-xs">
                              {item.fileName}
                            </TooltipContent>
                          </Tooltip>
                          <p className="text-[10px] text-muted-foreground font-mono">ID: {item.mediaItemId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{splitFileName(item.fileName).ext || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={item.status}
                          queuedAt={item.queuedAt}
                          startedAt={item.startedAt}
                          completedAt={item.completedAt}
                          lastAttempt={item.lastAttempt}
                          trailing={item.error ? (
                            <button
                              onClick={() => setErrorDialogItem(item)}
                              className="inline-flex cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </button>
                          ) : undefined}
                        />
                      </td>
                      <td className="px-4 py-3 w-36">
                        <div className="flex items-center gap-2">
                          <Progress value={item.progress} className="h-1.5 flex-1" />
                          <span className="font-mono text-xs text-muted-foreground w-8 text-right">{item.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-xs text-muted-foreground">{item.fileSize}</span>
                      </td>
                      <td className="px-4 py-3">
                        {(item.status === "failed" || item.status === "waitingForProcessAfterFail") && !item.error && (
                          <button
                            onClick={() => setErrorDialogItem(item)}
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="Retry"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {isFetchingMore && (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-xs font-mono">Loading…</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={7}>
                      <div ref={sentinelRef} className="h-1" />
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scroll to top — desktop only */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="hidden md:flex absolute bottom-4 right-4 h-10 w-10 rounded-xl bg-secondary items-center justify-center text-secondary-foreground hover:bg-accent transition-all z-20"
          title="Scroll to top"
        >
          <ChevronsUp className="h-5 w-5" />
        </button>
      )}

      <ErrorDetailDialog
        open={!!errorDialogItem}
        onOpenChange={(open) => !open && setErrorDialogItem(null)}
        fileName={errorDialogItem?.fileName ?? ""}
        mediaItemId={errorDialogItem?.mediaItemId ?? 0}
        error={errorDialogItem?.error ?? ""}
      />
    </div>
  );
}
