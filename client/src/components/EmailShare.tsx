import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Mail, Send, X, UserPlus, CheckCircle } from "lucide-react";

interface EmailShareProps {
  summaryId: string;
  onSuccess: () => void;
}

export default function EmailShare({ summaryId, onSuccess }: EmailShareProps) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState("");
  const [subject, setSubject] = useState(`Meeting Summary - ${new Date().toLocaleDateString()}`);
  const [format, setFormat] = useState<"html" | "pdf" | "both">("html");
  const [ccSelf, setCcSelf] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const sendEmailMutation = useMutation({
    mutationFn: async (data: {
      recipients: string[];
      subject: string;
      format: "html" | "pdf" | "both";
      ccSelf: boolean;
    }) => {
      const response = await apiRequest("POST", `/api/summaries/${summaryId}/email`, data);
      return response.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      toast({
        title: "Email sent successfully!",
        description: `Summary has been sent to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`,
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const addRecipient = () => {
    if (!newRecipient.trim()) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newRecipient)) {
      toast({
        title: "Invalid email address",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    if (recipients.includes(newRecipient)) {
      toast({
        title: "Email already added",
        description: "This recipient is already in the list",
        variant: "destructive",
      });
      return;
    }
    
    setRecipients([...recipients, newRecipient]);
    setNewRecipient("");
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleSendEmail = () => {
    if (recipients.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add at least one email recipient",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: "No subject line",
        description: "Please enter an email subject",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      recipients,
      subject,
      format,
      ccSelf,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRecipient();
    }
  };

  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  };

  if (showSuccess) {
    return (
      <Card className="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600 dark:text-green-400 h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Summary Sent Successfully!
              </h3>
              <p className="text-green-600 dark:text-green-300">
                Your meeting summary has been sent to {recipients.length} recipient{recipients.length > 1 ? 's' : ''}.
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex space-x-3">
            <Button 
              onClick={() => window.location.reload()}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              Create New Summary
            </Button>
            <Button 
              variant="outline"
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              View History
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Mail className="text-primary-600 mr-3 h-5 w-5" />
          4. Share Summary
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Recipients */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Recipients
            </Label>
            
            {/* Recipients List */}
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {recipients.map((email) => (
                <div 
                  key={email} 
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {getInitials(email)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRecipient(email)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {recipients.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Mail className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p>No recipients added yet</p>
                </div>
              )}
            </div>

            {/* Add Recipient Input */}
            <div className="flex space-x-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-white dark:bg-gray-700"
              />
              <Button 
                onClick={addRecipient}
                className="px-6 bg-primary-600 hover:bg-primary-700 text-white"
                disabled={!newRecipient.trim()}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Email Options */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Email Options
            </Label>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Subject Line
                </Label>
                <Input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-white dark:bg-gray-700"
                />
              </div>
              
              <div>
                <Label htmlFor="format" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Format
                </Label>
                <Select value={format} onValueChange={(value: "html" | "pdf" | "both") => setFormat(value)}>
                  <SelectTrigger className="bg-white dark:bg-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML Email</SelectItem>
                    <SelectItem value="pdf">PDF Attachment</SelectItem>
                    <SelectItem value="both">Both HTML & PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="ccSelf" 
                  checked={ccSelf}
                  onCheckedChange={(checked) => setCcSelf(checked as boolean)}
                />
                <Label 
                  htmlFor="ccSelf" 
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Send a copy to myself
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button 
            onClick={handleSendEmail}
            disabled={sendEmailMutation.isPending || recipients.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 font-medium text-lg"
          >
            <Send className="mr-3 h-5 w-5" />
            {sendEmailMutation.isPending ? "Sending..." : "Send Summary"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
