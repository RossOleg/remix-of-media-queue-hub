import { Skeleton } from "@/components/ui/skeleton";
import type { QueueStatusResponse } from "@/api/queueApi";
import type { FileStatus } from "@/api/queueApi";

type Filter = "all" | FileStatus;

interface Props {
  apiStats: QueueStatusResponse | null;
  isLoading: boolean;
  error: Error | null;
  activeFilter?: Filter;
  onFilterChange?: (filter: Filter) => void;
}

export function QueueStatsCards({ apiStats, isLoading, error, activeFilter = "all", onFilterChange }: Props) {
  const d = apiStats?.data;
  const total = d ? d.waiting + d.processing + d.processed + d.failed : 0;

  const stats: { label: string; value: number; filter: Filter; accent: string | null }[] = [
    { label: "Waiting", value: d?.waiting ?? 0, filter: "waiting", accent: "bg-muted text-foreground" },
    { label: "Processing", value: d?.processing ?? 0, filter: "processing", accent: "bg-warning/15 text-warning" },
    { label: "Failed", value: d?.failed ?? 0, filter: "failed", accent: "bg-destructive/15 text-destructive" },
    { label: "Processed", value: d?.processed ?? 0, filter: "processed", accent: "bg-success/15 text-success" },
    { label: "Total", value: total, filter: "all", accent: null },
  ];

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive font-mono">
        Loading error: {error.message}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
      {stats.map(s => {
        const isActive = activeFilter === s.filter;
        const hasValue = s.value > 0;

        return (
          <button
            key={s.label}
            onClick={() => onFilterChange?.(isActive && s.filter !== "all" ? "all" : s.filter)}
            className={`
              rounded-lg p-2 text-center transition-all cursor-pointer border
              ${isActive
                ? `ring-2 ring-primary/40 border-primary/30 ${s.accent && hasValue ? s.accent : "bg-card"}`
                : `border-transparent hover:border-border ${s.accent && hasValue ? s.accent : "bg-card"} hover:opacity-80`
              }
            `}
          >
            <span className="text-[10px] uppercase tracking-wider md:tracking-widest text-muted-foreground truncate block">
              {s.label}
            </span>
            {isLoading ? (
              <Skeleton className="mx-auto mt-1 h-7 w-12" />
            ) : (
              <p className={`mt-0.5 text-2xl font-mono font-extrabold tabular-nums ${isActive ? "text-foreground" : "text-card-foreground"}`}>
                {s.value}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
