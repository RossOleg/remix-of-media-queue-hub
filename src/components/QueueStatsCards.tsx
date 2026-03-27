import { Skeleton } from "@/components/ui/skeleton";
import type { QueueStatusResponse } from "@/api/queueApi";

interface Props {
  apiStats: QueueStatusResponse | null;
  isLoading: boolean;
  error: Error | null;
}

export function QueueStatsCards({ apiStats, isLoading, error }: Props) {
  const d = apiStats?.data;
  const total = d ? d.waiting + d.processing + d.processed + d.failed : 0;

  const stats = [
    { label: "Total", value: total },
    { label: "Waiting", value: d?.waiting ?? 0 },
    { label: "Processing", value: d?.processing ?? 0 },
    { label: "Processed", value: d?.processed ?? 0 },
    { label: "Failed", value: d?.failed ?? 0 },
    { label: "Retry", value: d?.waitingForProcessAfterError ?? 0 },
  ];

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive font-mono">
        Loading error: {error.message}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-6 gap-2">
      {stats.map(s => (
        <div key={s.label} className="rounded-lg bg-card p-2 text-center">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</span>
          {isLoading ? (
            <Skeleton className="mx-auto mt-1 h-7 w-12" />
          ) : (
            <p className="mt-0.5 text-2xl font-mono font-extrabold tabular-nums text-card-foreground">{s.value}</p>
          )}
        </div>
      ))}
    </div>
  );
}
