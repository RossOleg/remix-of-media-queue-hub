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

export function StatusBadge({ status }: { status: FileStatus }) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium ${c.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass[status]}`} />
      {c.label}
    </span>
  );
}
