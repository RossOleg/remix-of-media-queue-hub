import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Search, X, Sun, Moon } from "lucide-react";
import { PARENT_BASE } from "@/lib/config";
import {
  fetchQueueStatus,
  fetchQueueItems,
  mapRawItem,
  STATUS_TO_INT,
  SORT_KEY_TO_INT,
  type FileStatus,
  type SortKey,
} from "@/api/queueApi";
import { QueueStatsCards } from "@/components/QueueStatsCards";
import { QueueTable } from "@/components/QueueTable";

type Filter = "all" | FileStatus;

const filterStyles: Record<Filter, { active: string }> = {
  all: { active: "bg-foreground/15 border-foreground/40 text-foreground" },
  waiting: { active: "bg-muted border-foreground/20 text-foreground" },
  processing: { active: "bg-warning/20 border-warning/40 text-warning" },
  processed: { active: "bg-success/20 border-success/40 text-success" },
  failed: { active: "bg-destructive/20 border-destructive/40 text-destructive" },
  waitingForProcessAfterFail: { active: "bg-primary/15 border-primary/40 text-primary" },
};

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "waiting", label: "Waiting" },
  { value: "processing", label: "Processing" },
  { value: "processed", label: "Processed" },
  { value: "failed", label: "Failed" },
  { value: "waitingForProcessAfterFail", label: "Retry Pending" },
];

const PAGE_SIZE = 50;

const Index = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [authConfirmed, setAuthConfirmed] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<0 | 1>(0); // 0=asc, 1=desc

  const { data: apiStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["queueStatus"],
    queryFn: fetchQueueStatus,
    refetchInterval: 5000,
  });

  // Once we get a successful stats response, auth is confirmed
  if (apiStats && !authConfirmed) {
    setAuthConfirmed(true);
  }

  const { data: itemsData, isLoading: itemsLoading, error: itemsError } = useQuery({
    queryKey: ["queueItems", filter, search, page, sortBy, sortOrder],
    queryFn: () =>
      fetchQueueItems({
        status: STATUS_TO_INT[filter] ?? -1,
        searchText: search,
        pageIndex: page,
        pageSize: PAGE_SIZE,
        sortBy: sortBy ? SORT_KEY_TO_INT[sortBy] : 0,
        sortOrder,
      }),
    refetchInterval: 5000,
  });

  const items = itemsData?.data?.items?.map(mapRawItem) ?? [];
  const totalItems = itemsData?.data?.totalItems ?? 0;

  const handleFilterChange = useCallback((f: Filter) => {
    setFilter(f);
    setPage(0);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  // Don't render UI until auth is confirmed (prevents flash before 401 redirect)
  if (!authConfirmed && statsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-overlay">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Media Queue</h1>
            <p className="text-xs text-muted-foreground font-mono">AI Processing Pipeline</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                const html = document.documentElement;
                const isDark = html.classList.contains("dark");
                html.classList.toggle("dark", !isDark);
              }}
              className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-accent transition-colors"
              title="Toggle theme"
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="h-4 w-4 hidden dark:block" />
            </button>
            <button
              onClick={() => { window.close(); setTimeout(() => { window.location.href = PARENT_BASE || "/"; }, 100); }}
              className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6">
        <QueueStatsCards apiStats={apiStats ?? null} isLoading={statsLoading} error={statsError} />

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search by file name…"
              className="w-full h-8 pl-8 pr-3 rounded-md text-xs font-mono border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map(f => (
                <button
                  key={f.value}
                  onClick={() => handleFilterChange(f.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-colors border ${
                    filter === f.value
                      ? filterStyles[f.value].active
                      : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

        <QueueTable
          items={items}
          isLoading={itemsLoading}
          error={itemsError}
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={totalItems}
          onPageChange={setPage}
        />
      </main>
    </div>
  );
};

export default Index;
