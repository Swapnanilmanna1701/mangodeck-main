import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAutosave } from "@/hooks/useAutosave";
import { apiRequest } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bold,
  CheckCircle,
  Download,
  Edit3,
  FileText,
  Italic,
  List,
  RefreshCw,
  Save,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Summary {
  id: string;
  title: string;
  summaryContent: string;
  createdAt: string;
  tone: string;
  status: string;
  autoSaved: boolean;
}

interface SummaryEditorProps {
  summaryId: string;
  onApprove: () => void;
  onSummaryChange: (summary: string) => void;
}

export default function SummaryEditor({
  summaryId,
  onApprove,
  onSummaryChange,
}: SummaryEditorProps) {
  const [content, setContent] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch summary data
  const { data: summary, isLoading } = useQuery<Summary>({
    queryKey: ["summaries", summaryId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/summaries/${summaryId}`);
      return response.json();
    },
    enabled: !!summaryId,
    retry: 2,
    staleTime: 30000,
  });

  // Update summary mutation
  const updateSummaryMutation = useMutation({
    mutationFn: async (data: {
      summaryContent: string;
      wordCount: number;
      autoSaved: boolean;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/summaries/${summaryId}`,
        data
      );
      if (!response.ok) {
        throw new Error("Failed to update summary");
      }
      return response.json();
    },
    onSuccess: () => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ["summaries", summaryId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving summary",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve summary mutation
  const approveSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "PATCH",
        `/api/summaries/${summaryId}`,
        {
          status: "approved",
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Summary approved!",
        description: "Your summary is ready to be shared",
      });
      onApprove();
      queryClient.invalidateQueries({
        queryKey: ["/api/summaries", summaryId],
      });
    },
  });

  // Regenerate summary mutation
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/summaries/${summaryId}/generate`
      );
      return response.json();
    },
    onSuccess: (data) => {
      setContent(data.summaryContent);
      toast({
        title: "Summary regenerated!",
        description: "A new AI summary has been generated",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/summaries", summaryId],
      });
    },
  });

  // File export handlers with error handling
  const handleExport = async (format: "pdf" | "docx") => {
    try {
      const response = await fetch(
        `/api/summaries/${summaryId}/export/${format}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${summary?.title || "summary"}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: `Your summary has been exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Memoized save handler
  const saveContent = useCallback(
    async (contentToSave: string) => {
      if (!contentToSave.trim()) return;

      const wordCount = contentToSave
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      try {
        await updateSummaryMutation.mutateAsync({
          summaryContent: contentToSave,
          wordCount,
          autoSaved: true,
        });
      } catch (error) {
        console.error("Failed to save content:", error);
      }
    },
    [updateSummaryMutation]
  );

  // Autosave setup
  useAutosave(content, saveContent, 2000);

  // Content initialization
  useEffect(() => {
    if (summary?.summaryContent && !content) {
      setContent(summary.summaryContent);
    }
  }, [summary, content]);

  // Parent notification
  useEffect(() => {
    onSummaryChange(content);
  }, [content, onSummaryChange]);

  if (isLoading) {
    return (
      <div className="mt-8 animate-pulse">
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
    );
  }

  const wordCount = content
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const isLoading_operations = updateSummaryMutation.isPending;

  const getSaveStatus = () => {
    if (updateSummaryMutation.isPending) return "Saving...";
    if (lastSaved) return "Saved";
    return summary?.autoSaved ? "Saved" : "Not saved";
  };

  return (
    <Card className="mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Edit3 className="text-primary-600 mr-3 h-5 w-5" />
            3. Review & Edit Summary
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Save className="h-4 w-4" />
            <span>{getSaveStatus()}</span>
          </div>
        </div>

        {/* Summary Metadata */}
        {summary && (
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              📄 {summary?.title || "Summary"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              📅{" "}
              {summary?.createdAt
                ? new Date(summary.createdAt).toLocaleDateString()
                : "Today"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              🎯 {summary?.tone || "professional"}
            </Badge>
          </div>
        )}

        {/* Editor Toolbar */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {wordCount} words
              </div>
            </div>
          </div>

          <Textarea
            className="min-h-96 border-0 focus:ring-0 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Your AI-generated summary will appear here..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => approveSummaryMutation.mutate()}
            disabled={isLoading_operations || !content.trim()}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve Summary
          </Button>

          <Button
            onClick={() => regenerateMutation.mutate()}
            disabled={isLoading_operations}
            variant="outline"
            className="flex-1 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium py-3"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={() => handleExport("pdf")}
              variant="outline"
              className="px-6 py-3"
              disabled={isLoading_operations || !content.trim()}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button
              onClick={() => handleExport("docx")}
              variant="outline"
              className="px-6 py-3"
              disabled={isLoading_operations || !content.trim()}
            >
              <Download className="mr-2 h-4 w-4" />
              Export DOCX
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
