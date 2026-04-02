import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, X } from "lucide-react";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { PARENT_BASE } from "@/lib/config";
import {
  fetchQueueStatus,
  fetchQueueItems,
  fetchCustomScheme,
  fetchCustomColor,
  fetchAdditionalCustomColor,
  matchPalette,
  mapRawItem,
  STATUS_TO_INT,
  SORT_KEY_TO_INT,
  type FileStatus,
  type SortKey,
} from "@/api/queueApi";
import { QueueStatsCards } from "@/components/QueueStatsCards";
import { QueueTable } from "@/components/QueueTable";

type Filter = "all" | FileStatus;


const PAGE_SIZE = 50;

const Index = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [authConfirmed, setAuthConfirmed] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<0 | 1>(0);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const isVisible = usePageVisibility();

  const { data: apiStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["queueStatus"],
    queryFn: fetchQueueStatus,
    refetchInterval: isVisible ? 5000 : false,
  });

  if (apiStats && !authConfirmed) {
    setAuthConfirmed(true);
  }

  const { data: isLightTheme } = useQuery({
    queryKey: ["branding", "scheme"],
    queryFn: fetchCustomScheme,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (isLightTheme === undefined) return;
    document.documentElement.classList.toggle("dark", !isLightTheme);
  }, [isLightTheme]);

  const { data: accentColor } = useQuery({
    queryKey: ["branding", "accentColor", isLightTheme],
    queryFn: () => isLightTheme ? fetchCustomColor() : fetchAdditionalCustomColor(),
    enabled: isLightTheme !== undefined,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!accentColor || isLightTheme === undefined) return;
    const palette = matchPalette(accentColor, isLightTheme);
    const root = document.documentElement.style;
    root.setProperty("--primary", palette.primary);
    root.setProperty("--primary-foreground", palette.primaryForeground);
    root.setProperty("--ring", palette.primary);
    root.setProperty("--sidebar-primary", palette.primary);
    root.setProperty("--sidebar-primary-foreground", palette.primaryForeground);
    root.setProperty("--sidebar-ring", palette.primary);
  }, [accentColor, isLightTheme]);

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
    refetchInterval: isVisible ? 5000 : false,
  });

  const items = itemsData?.data?.items?.map(mapRawItem) ?? [];
  const totalItems = itemsData?.data?.totalItems ?? 0;

  const handleFilterChange = useCallback((f: Filter) => {
    setFilter(f);
    setPage(0);
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    if (value === "") {
      setSearch("");
      setPage(0);
    } else {
      debounceRef.current = setTimeout(() => {
        setSearch(value);
        setPage(0);
      }, 400);
    }
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(prev => (prev === 0 ? 1 : 0));
    } else {
      setSortBy(key);
      setSortOrder(0);
    }
    setPage(0);
  }, [sortBy]);

  if (!authConfirmed && statsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="sticky top-0 z-10 bg-background shrink-0 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <button
            onClick={() => { window.close(); setTimeout(() => { window.location.href = PARENT_BASE || "/"; }, 100); }}
            className="h-11 w-11 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground hover:bg-accent transition-colors shrink-0"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Media Queue</h1>
            <p className="text-xs text-muted-foreground font-mono">AI Processing Pipeline</p>
          </div>

          {/* Desktop search */}
          <div className="relative ml-auto hidden md:block w-full max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search by file name…"
              className="w-full h-10 pl-10 pr-9 rounded-xl text-sm font-mono border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearchOpen(prev => !prev)}
            className={`ml-auto md:hidden h-10 w-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
              mobileSearchOpen ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile search bar — slides down below header */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-3 animate-in slide-in-from-top-2 duration-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search by file name…"
                autoFocus
                className="w-full h-10 pl-10 pr-9 rounded-xl text-sm font-mono border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-colors"
              />
              {searchInput && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-4 sm:gap-6 flex-1 min-h-0 w-full">
        <QueueStatsCards
          apiStats={apiStats ?? null}
          isLoading={statsLoading}
          error={statsError}
          activeFilter={filter}
          onFilterChange={handleFilterChange}
        />

        <div className="flex-1 min-h-0">
          <QueueTable
            items={items}
            isLoading={itemsLoading}
            error={itemsError}
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={totalItems}
            onPageChange={setPage}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;