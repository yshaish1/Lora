"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";

interface TrainingJob {
  id: string;
  triggerWord: string;
  status: string;
  createdAt: string;
}

interface PromptFormProps {
  trainingJobs: TrainingJob[];
  onGenerate: (prompt: string, trainingJobId: string) => Promise<void>;
  isGenerating: boolean;
}

export function PromptForm({ trainingJobs, onGenerate, isGenerating }: PromptFormProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(
    trainingJobs[0]?.id || ""
  );

  const selectedJob = trainingJobs.find((j) => j.id === selectedJobId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !selectedJobId) return;
    await onGenerate(prompt, selectedJobId);
  };

  if (trainingJobs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No trained models yet</p>
        <p className="text-sm mt-1">Upload photos and train a model first</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {trainingJobs.length > 1 && (
        <div className="space-y-2">
          <Label>Model</Label>
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {trainingJobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.triggerWord} - {new Date(job.createdAt).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="prompt">Prompt</Label>
        <div className="flex gap-2">
          <Input
            id="prompt"
            placeholder={`A photo of ${selectedJob?.triggerWord || "TOK"} on a tropical beach at sunset`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
          />
          <Button type="submit" disabled={isGenerating || !prompt.trim()}>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Include <span className="font-mono font-medium">{selectedJob?.triggerWord || "TOK"}</span> in your prompt to reference yourself
        </p>
      </div>
    </form>
  );
}
