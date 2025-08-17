import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export function useAutosave<T>(
  data: T,
  onSave: (data: T) => Promise<void>,
  delay: number = 2000
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const dataRef = useRef<T>(data);
  const isFirstRun = useRef(true);
  const { toast } = useToast();

  useEffect(() => {
    // Skip autosave on first render
    if (isFirstRun.current) {
      isFirstRun.current = false;
      dataRef.current = data;
      return;
    }

    // Skip if data hasn't changed
    if (dataRef.current === data) {
      return;
    }

    dataRef.current = data;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for autosave
    timeoutRef.current = setTimeout(async () => {
      try {
        await onSave(data);
      } catch (error: any) {
        toast({
          title: "Autosave failed",
          description: error.message || "Failed to save changes automatically",
          variant: "destructive",
        });
      }
    }, delay);

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, delay, toast]);
}
