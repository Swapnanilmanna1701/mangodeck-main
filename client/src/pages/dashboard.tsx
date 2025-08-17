import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import TranscriptInput from "@/components/TranscriptInput";
import SummarizationPrompt from "@/components/SummarizationPrompt";
import SummaryEditor from "@/components/SummaryEditor";
import EmailShare from "@/components/EmailShare";
import SummaryPreview from "@/components/SummaryPreview";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Cog, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [workflowData, setWorkflowData] = useState({
    transcript: "",
    filename: "",
    prompt: "",
    tone: "professional",
    summaryId: "",
    summary: "",
  });

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const steps = [
    { number: 1, name: "Upload", icon: "📄" },
    { number: 2, name: "Prompt", icon: "✏️" },
    { number: 3, name: "Generate", icon: "🤖" },
    { number: 4, name: "Edit", icon: "📝" },
    { number: 5, name: "Share", icon: "📧" },
  ];

  const progressWidth = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workflow Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Create Summary
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep} of {steps.length}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          
          {/* Step Indicators */}
          <div className="flex items-center justify-between text-xs">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    currentStep >= step.number 
                      ? "bg-primary-600 text-white" 
                      : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {step.number}
                </div>
                <span className={
                  currentStep >= step.number 
                    ? "text-gray-600 dark:text-gray-400" 
                    : "text-gray-400"
                }>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input Section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Transcript Input */}
            {currentStep >= 1 && (
              <TranscriptInput
                onTranscriptChange={(transcript, filename) => {
                  setWorkflowData(prev => ({ ...prev, transcript, filename: filename || "" }));
                  if (transcript && currentStep === 1) {
                    setCurrentStep(2);
                  }
                }}
                transcript={workflowData.transcript}
                filename={workflowData.filename}
              />
            )}

            {/* Step 2: Summarization Prompt */}
            {currentStep >= 2 && workflowData.transcript && (
              <SummarizationPrompt
                onPromptChange={(prompt, tone) => {
                  setWorkflowData(prev => ({ ...prev, prompt, tone }));
                }}
                onGenerate={(summaryId) => {
                  setWorkflowData(prev => ({ ...prev, summaryId }));
                  setCurrentStep(4); // Skip to edit step after generation
                }}
                transcript={workflowData.transcript}
                prompt={workflowData.prompt}
                tone={workflowData.tone}
              />
            )}

          </div>

          {/* Right Column - Preview & Results */}
          <div className="space-y-6">
            
            {/* Content Preview */}
            {workflowData.transcript && (
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Eye className="text-primary-600 mr-3 h-5 w-5" />
                    Content Preview
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <p className="whitespace-pre-wrap">
                      {workflowData.transcript.slice(0, 300)}
                      {workflowData.transcript.length > 300 && "..."}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Showing first 300 characters
                    </p>
                  </div>
                  {workflowData.filename && (
                    <div className="mt-3">
                      <Badge variant="outline" className="text-xs">
                        📄 {workflowData.filename}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Professional Preview */}
            {workflowData.summary && (
              <SummaryPreview
                content={workflowData.summary}
                title={`Meeting Summary - ${new Date().toLocaleDateString()}`}
                metadata={{
                  date: new Date().toLocaleDateString(),
                  wordCount: workflowData.summary.split(' ').filter(word => word.length > 0).length,
                  tone: workflowData.tone
                }}
              />
            )}
            
            {/* Processing Status */}
            {currentStep === 3 && (
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Cog className="text-primary-600 mr-3 h-5 w-5 animate-spin" />
                    Processing...
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="text-green-500 mr-2 h-4 w-4" />
                      Transcript uploaded
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent mr-2"></div>
                      Analyzing content...
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <div className="w-4 h-4 mr-2 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      </div>
                      Generating summary...
                    </div>
                  </div>
                  <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: "65%" }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>

        {/* Step 4: Summary Editor */}
        {currentStep >= 4 && workflowData.summaryId && (
          <SummaryEditor
            summaryId={workflowData.summaryId}
            onApprove={() => {
              setCurrentStep(5);
            }}
            onSummaryChange={(summary) => {
              setWorkflowData(prev => ({ ...prev, summary }));
            }}
          />
        )}

        {/* Step 5: Email Share */}
        {currentStep >= 5 && workflowData.summaryId && (
          <EmailShare
            summaryId={workflowData.summaryId}
            onSuccess={() => {
              // Show success message and optionally reset workflow
            }}
          />
        )}

      </main>
    </div>
  );
}
