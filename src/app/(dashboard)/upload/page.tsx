"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dropzone } from "@/components/upload/dropzone";
import { PhotoGrid } from "@/components/upload/photo-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Cpu } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [triggerWord, setTriggerWord] = useState("TOK");
  const [startingTraining, setStartingTraining] = useState(false);
  const [error, setError] = useState("");

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > 30) {
        setError("Maximum 30 photos allowed");
        return combined.slice(0, 30);
      }
      setError("");
      return combined;
    });
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length < 5) {
      setError("Please select at least 5 photos");
      return;
    }

    setUploading(true);
    setError("");
    setUploadProgress("Uploading photos...");

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("photos", file));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      setUploadProgress(`${data.count} photos uploaded successfully!`);
      setUploaded(true);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleStartTraining = async () => {
    setStartingTraining(true);
    setError("");

    try {
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggerWord }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start training");
        return;
      }

      router.push("/training");
    } catch {
      setError("Failed to start training. Please try again.");
    } finally {
      setStartingTraining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Photos</h1>
        <p className="text-muted-foreground mt-1">
          Upload 5-30 photos of yourself to train your AI model
        </p>
      </div>

      {!uploaded ? (
        <>
          <Dropzone onFilesSelected={handleFilesSelected} disabled={uploading} />

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {files.length} photo{files.length !== 1 ? "s" : ""} selected
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiles([])}
                  disabled={uploading}
                >
                  Clear all
                </Button>
              </div>

              <PhotoGrid files={files} onRemove={handleRemove} />

              <Button
                onClick={handleUpload}
                disabled={uploading || files.length < 5}
                className="w-full gap-2"
                size="lg"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? uploadProgress : `Upload ${files.length} Photos`}
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Photos Uploaded!</CardTitle>
            <CardDescription>
              Now configure your training settings and start the AI model training.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="triggerWord">Trigger Word</Label>
              <Input
                id="triggerWord"
                value={triggerWord}
                onChange={(e) => setTriggerWord(e.target.value)}
                placeholder="TOK"
              />
              <p className="text-xs text-muted-foreground">
                This word will be used in prompts to reference you. Example: &ldquo;A photo of {triggerWord} on a beach&rdquo;
              </p>
            </div>

            <Button
              onClick={handleStartTraining}
              disabled={startingTraining}
              className="w-full gap-2"
              size="lg"
            >
              {startingTraining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Cpu className="h-4 w-4" />
              )}
              {startingTraining ? "Starting Training..." : "Start Training"}
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
