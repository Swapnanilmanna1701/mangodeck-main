import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Upload, FileText, Trash2, CloudUpload } from "lucide-react";

interface TranscriptInputProps {
  onTranscriptChange: (transcript: string, filename?: string) => void;
  transcript: string;
  filename: string;
}

export default function TranscriptInput({ onTranscriptChange, transcript, filename }: TranscriptInputProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.txt', '.pdf', '.docx'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt, .pdf, or .docx file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await response.json();
      onTranscriptChange(data.text, data.filename);
      
      toast({
        title: "File uploaded successfully",
        description: `Processed ${data.filename}`,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [onTranscriptChange, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  const clearFile = () => {
    onTranscriptChange("", "");
  };

  const clearText = () => {
    onTranscriptChange("", "");
  };

  const wordCount = transcript.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = transcript.length;

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Upload className="text-primary-600 mr-3 h-5 w-5" />
          1. Input Transcript
        </h3>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <CloudUpload className="h-4 w-4" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="paste" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Paste Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            {!filename ? (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  dragActive
                    ? "border-primary-400 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <div className="max-w-sm mx-auto">
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-4" />
                  ) : (
                    <CloudUpload className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  )}
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {isUploading ? "Processing..." : "Drop your transcript here"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {isUploading ? "Please wait while we process your file" : "Or click to browse files"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Supports .pdf, .docx, .txt files up to 10MB
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileInput}
                  disabled={isUploading}
                />
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="text-primary-600 h-6 w-6" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {filename}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {wordCount} words, {charCount} characters
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="paste">
            <div className="space-y-4">
              <Textarea
                placeholder="Paste your meeting transcript here..."
                className="min-h-64 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={transcript}
                onChange={(e) => onTranscriptChange(e.target.value, "")}
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {wordCount} words, {charCount} characters
                </p>
                {transcript && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearText}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Clear text
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
