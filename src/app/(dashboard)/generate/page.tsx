"use client";

import { useEffect, useState, useCallback } from "react";
import { PromptForm } from "@/components/generate/prompt-form";
import { ImageGallery } from "@/components/generate/image-gallery";
import { Skeleton } from "@/components/ui/skeleton";

interface TrainingJob {
  id: string;
  triggerWord: string;
  status: string;
  createdAt: string;
}

interface GeneratedImageItem {
  id: string;
  prompt: string;
  cloudinaryUrl: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

export default function GeneratePage() {
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [images, setImages] = useState<GeneratedImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [trainRes, imgRes] = await Promise.all([
        fetch("/api/training"),
        fetch("/api/generate"),
      ]);

      const trainData = await trainRes.json();
      const imgData = await imgRes.json();

      if (trainRes.ok) {
        setTrainingJobs(
          trainData.jobs.filter((j: TrainingJob) => j.status === "succeeded")
        );
      }
      if (imgRes.ok) {
        setImages(imgData.images);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll for pending images
  useEffect(() => {
    const hasPending = images.some(
      (img) => !["succeeded", "failed"].includes(img.status)
    );
    if (!hasPending) return;

    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [images, fetchData]);

  const handleGenerate = async (prompt: string, trainingJobId: string) => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, trainingJobId }),
      });

      if (res.ok) {
        // Refresh images list
        await fetchData();
      }
    } catch {
      // error handled by fetchData
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Generate</h1>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Generate Images</h1>
        <p className="text-muted-foreground mt-1">
          Create AI-generated photos using your trained model
        </p>
      </div>

      <PromptForm
        trainingJobs={trainingJobs}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />

      <div>
        <h2 className="text-xl font-semibold mb-4">Generated Images</h2>
        <ImageGallery images={images} />
      </div>
    </div>
  );
}
