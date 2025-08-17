import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Sparkles, Zap } from "lucide-react";

interface SummarizationPromptProps {
  onPromptChange: (prompt: string, tone: string) => void;
  onGenerate: (summaryId: string) => void;
  transcript: string;
  prompt: string;
  tone: string;
}

const promptTemplates = {
  executive: "Create an executive summary with key decisions, high-level outcomes, and strategic implications. Focus on what leadership needs to know.",
  action: "Focus on action items, tasks, assignments, and deadlines. Include responsible persons and priority levels for each item.",
  detailed: "Provide comprehensive discussion points, detailed explanations, and thorough coverage of all topics discussed.",
  custom: ""
};

const toneDescriptions = {
  professional: "Professional & Formal",
  casual: "Casual & Friendly", 
  concise: "Concise & Direct",
  detailed: "Detailed & Thorough"
};

export default function SummarizationPrompt({ 
  onPromptChange, 
  onGenerate, 
  transcript, 
  prompt, 
  tone 
}: SummarizationPromptProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof promptTemplates>("custom");
  const { toast } = useToast();

  const createSummaryMutation = useMutation({
    mutationFn: async (data: { title: string; originalContent: string; prompt: string; tone: string }) => {
      const response = await apiRequest("POST", "/api/summaries", {
        ...data,
        summaryContent: "",
        wordCount: 0,
        status: "draft"
      });
      return response.json();
    },
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async (summaryId: string) => {
      const response = await apiRequest("POST", `/api/summaries/${summaryId}/generate`, {});
      return response.json();
    },
  });

  const handleTemplateSelect = (template: keyof typeof promptTemplates) => {
    setSelectedTemplate(template);
    if (template !== "custom") {
      onPromptChange(promptTemplates[template], tone);
    }
  };

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      toast({
        title: "No transcript provided",
        description: "Please upload a file or paste text before generating a summary",
        variant: "destructive",
      });
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: "No instructions provided",
        description: "Please provide summarization instructions or select a template",
        variant: "destructive",
      });
      return;
    }

    try {
      // First create the summary record
      const title = `Meeting Summary - ${new Date().toLocaleDateString()}`;
      const summary = await createSummaryMutation.mutateAsync({
        title,
        originalContent: transcript,
        prompt,
        tone,
      });

      // Then generate the AI summary
      await generateSummaryMutation.mutateAsync(summary.id);

      toast({
        title: "Summary generated!",
        description: "Your AI-powered summary is ready for review",
      });

      onGenerate(summary.id);
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate summary",
        variant: "destructive",
      });
    }
  };

  const isLoading = createSummaryMutation.isPending || generateSummaryMutation.isPending;

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Sparkles className="text-primary-600 mr-3 h-5 w-5" />
          2. Summarization Instructions
        </h3>
        
        {/* Template Selection */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Quick Templates
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries({
              executive: { title: "Executive Summary", desc: "High-level overview with key decisions" },
              action: { title: "Action Items", desc: "Focus on tasks and assignments" },
              detailed: { title: "Detailed Notes", desc: "Comprehensive discussion points" },
              custom: { title: "Custom Prompt", desc: "Write your own instructions" }
            }).map(([key, { title, desc }]) => (
              <button
                key={key}
                onClick={() => handleTemplateSelect(key as keyof typeof promptTemplates)}
                className={`text-left p-3 border rounded-lg transition-colors ${
                  selectedTemplate === key
                    ? "border-primary-400 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500"
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">{title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="mb-4">
          <Label htmlFor="custom-prompt" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Custom Instructions
          </Label>
          <Textarea
            id="custom-prompt"
            placeholder="Describe how you want the summary formatted. For example: 'Create a summary with key decisions, action items, and next steps. Include responsible persons and deadlines.'"
            className="min-h-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value, tone)}
          />
        </div>

        {/* Tone Selection */}
        <div className="mb-6">
          <Label htmlFor="tone-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Tone & Style
          </Label>
          <Select value={tone} onValueChange={(value) => onPromptChange(prompt, value)}>
            <SelectTrigger className="bg-white dark:bg-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(toneDescriptions).map(([key, desc]) => (
                <SelectItem key={key} value={key}>
                  {desc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerate}
          disabled={isLoading || !transcript.trim() || !prompt.trim()}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3"
        >
          <Zap className="mr-2 h-4 w-4" />
          {isLoading ? "Generating Summary..." : "Generate Summary"}
        </Button>
      </CardContent>
    </Card>
  );
}
