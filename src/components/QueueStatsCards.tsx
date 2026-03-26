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
    { label: "Total", value: total, icon: FileStack, className: "glow-primary border-primary/20" },
    { label: "Waiting", value: d?.waiting ?? 0, icon: Clock, className: "border-border" },
    { label: "Processing", value: d?.processing ?? 0, icon: Loader, className: "glow-warning border-warning/20" },
    { label: "Processed", value: d?.processed ?? 0, icon: CheckCircle, className: "glow-success border-success/20" },
    { label: "Failed", value: d?.failed ?? 0, icon: AlertTriangle, className: "glow-destructive border-destructive/20" },
    { label: "Retry Pending", value: d?.waitingForProcessAfterError ?? 0, icon: RefreshCw, className: "border-primary/20" },
  ];

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive font-mono">
        Loading error: {error.message}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {stats.map(s => (
        <div key={s.label} className={`rounded-lg border bg-card p-5 ${s.className}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{s.label}</span>
            <s.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-9 w-16" />
          ) : (
            <p className="mt-2 text-3xl font-mono font-bold text-card-foreground">{s.value}</p>
          )}
        </div>
      ))}
    </div>
  );
}
