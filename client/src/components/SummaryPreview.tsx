import { Card, CardContent } from "@/components/ui/card";
import { Eye, FileText } from "lucide-react";

interface SummaryPreviewProps {
  content: string;
  title?: string;
  metadata?: {
    date: string;
    wordCount: number;
    tone: string;
  };
}

export default function SummaryPreview({ content, title, metadata }: SummaryPreviewProps) {
  if (!content) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Eye className="text-primary-600 mr-3 h-5 w-5" />
            Preview
          </h3>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>Generate a summary to see the preview</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Convert content for professional display
  const formatContent = (text: string) => {
    return text
      .replace(/#{1,6}\s*(.*)/g, '<h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800 dark:text-gray-200">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/^[-*+]\s+(.*)$/gm, '<li class="ml-4 mb-1">• $1</li>')
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">')
      .replace(/\n/g, '<br>');
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Eye className="text-primary-600 mr-3 h-5 w-5" />
          Professional Preview
        </h3>
        
        {/* Preview Container with White Background */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm max-h-96 overflow-y-auto">
          {/* Document Header */}
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {title || 'Meeting Summary'}
            </h1>
            {metadata && (
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>📅 {metadata.date}</span>
                <span>📝 {metadata.wordCount} words</span>
                <span>🎯 {metadata.tone}</span>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div 
            className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: `<p class="mb-4 text-gray-700 leading-relaxed">${formatContent(content)}</p>`
            }}
          />
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          This is how your summary will appear in exported documents and emails
        </p>
      </CardContent>
    </Card>
  );
}