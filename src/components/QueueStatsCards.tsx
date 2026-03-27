import { CheckCircle, AlertTriangle, Loader, FileStack, Clock, RefreshCw } from "lucide-react";
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
    { label: "Total", value: total, icon: FileStack, className: "" },
    { label: "Waiting", value: d?.waiting ?? 0, icon: Clock, className: "" },
    { label: "Processing", value: d?.processing ?? 0, icon: Loader, className: "" },
    { label: "Processed", value: d?.processed ?? 0, icon: CheckCircle, className: "" },
    { label: "Failed", value: d?.failed ?? 0, icon: AlertTriangle, className: "" },
    { label: "Retry Pending", value: d?.waitingForProcessAfterError ?? 0, icon: RefreshCw, className: "" },
  ];

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive font-mono">
        Loading error: {error.message}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
      {stats.map(s => (
        <div key={s.label} className={`rounded-lg bg-card p-3 sm:p-5 ${s.className}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">{s.label}</span>
            <s.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 sm:h-9 w-12 sm:w-16" />
          ) : (
            <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-mono font-bold text-card-foreground">{s.value}</p>
          )}
        </div>
      ))}
    </div>
  );
}
