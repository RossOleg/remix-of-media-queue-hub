import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Search, X, Sun, Moon } from "lucide-react";
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
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { data: apiStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["queueStatus"],
    queryFn: fetchQueueStatus,
    refetchInterval: 5000,
  });

  const { data: itemsData, isLoading: itemsLoading, error: itemsError } = useQuery({
    queryKey: ["queueItems", filter, search, page, sortKey, sortDir],
    queryFn: () =>
      fetchQueueItems({
        status: STATUS_TO_INT[filter] ?? -1,
        searchText: search,
        pageIndex: page,
        pageSize: PAGE_SIZE,
        sortBy: sortKey ? SORT_KEY_TO_INT[sortKey] : 0,
        sortOrder: sortDir === "asc" ? 0 : 1,
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

  const handleSort = useCallback((key: SortKey | null, dir: "asc" | "desc") => {
    setSortKey(key);
    setSortDir(dir);
    setPage(0);
  }, []);

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
              onClick={() => window.close()}
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
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-muted-foreground font-mono">
            {totalItems} file(s)
          </span>
        </div>

        <QueueTable
          items={items}
          isLoading={itemsLoading}
          error={itemsError}
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={totalItems}
          sortKey={sortKey}
          sortDir={sortDir}
          onPageChange={setPage}
          onSort={handleSort}
        />
      </main>
    </div>
  );
};

export default Index;
