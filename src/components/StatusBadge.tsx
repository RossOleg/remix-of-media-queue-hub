import type { FileStatus } from "@/api/queueApi";

const config: Record<FileStatus, { label: string; className: string }> = {
  waiting: { label: "Waiting", className: "bg-secondary text-secondary-foreground border-border" },
  processing: { label: "Processing", className: "bg-warning/15 text-warning border-warning/30" },
  processed: { label: "Processed", className: "bg-success/15 text-success border-success/30" },
  failed: { label: "Failed", className: "bg-destructive/15 text-destructive border-destructive/30" },
  waitingForProcessAfterFail: { label: "Retry Pending", className: "bg-primary/10 text-primary border-primary/30" },
};

const dotClass: Record<FileStatus, string> = {
  waiting: "bg-muted-foreground",
  processing: "bg-warning status-pulse",
  processed: "bg-success",
  failed: "bg-destructive",
  waitingForProcessAfterFail: "bg-primary status-pulse",
};

function fmtDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime()) || d.getFullYear() <= 1) return null;
  return `${d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })} ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
}

interface StatusBadgeProps {
  status: FileStatus;
  queuedAt?: string;
  startedAt?: string;
  completedAt?: string;
  lastAttempt?: string;
}

export function StatusBadge({ status, queuedAt, startedAt, completedAt, lastAttempt }: StatusBadgeProps) {
  const c = config[status];

  const dateMap: Record<FileStatus, { date: string | undefined; label: string }> = {
    waiting: { date: queuedAt, label: "Queued At" },
    processing: { date: startedAt, label: "Started at" },
    processed: { date: completedAt, label: "Ended at" },
    failed: { date: lastAttempt, label: "Last Attempt at" },
    waitingForProcessAfterFail: { date: lastAttempt, label: "Last Attempt at" },
  };

  const { date, label } = dateMap[status];
  const formatted = fmtDate(date);

  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium w-fit ${c.className}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass[status]}`} />
        {c.label}
      </span>
      {formatted && (
        <span className="text-[10px] font-mono text-muted-foreground pl-1">{formatted}</span>
      )}
    </div>
  );
}
