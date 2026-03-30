import { useState, useEffect } from "react";
import { RotateCcw, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchAISettings, retryAIProcessing, type AISettings } from "@/api/queueApi";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  mediaItemId: number;
  error: string;
}

export function ErrorDetailDialog({ open, onOpenChange, fileName, mediaItemId, error }: Props) {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setLoadingSettings(true);
    setSettingsError(null);
    fetchAISettings()
      .then(setSettings)
      .catch((e) => setSettingsError(e.message))
      .finally(() => setLoadingSettings(false));
  }, [open]);

  const handleRetry = async () => {
    if (!settings) return;
    setRetrying(true);
    try {
      await retryAIProcessing(mediaItemId, settings);
      queryClient.invalidateQueries({ queryKey: ["queueItems"] });
      queryClient.invalidateQueries({ queryKey: ["queueStatus"] });
      onOpenChange(false);
    } catch (e: any) {
      setSettingsError(e.message);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-sm">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            Processing Error
          </DialogTitle>
          <DialogDescription className="font-mono text-xs truncate">
            {fileName} (ID: {mediaItemId})
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 max-h-64 overflow-y-auto">
          <p className="font-mono text-xs text-destructive whitespace-pre-wrap break-words">
            {error}
          </p>
        </div>

        {settingsError && (
          <p className="font-mono text-xs text-destructive">
            Failed to load settings: {settingsError}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="font-mono text-xs"
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={handleRetry}
            disabled={loadingSettings || retrying || !settings}
            className="font-mono text-xs gap-1.5"
          >
            {retrying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : loadingSettings ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            {retrying ? "Retrying…" : loadingSettings ? "Loading…" : "Retry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
