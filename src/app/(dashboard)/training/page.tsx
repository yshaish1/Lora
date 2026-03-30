"use client";

import { useEffect, useState } from "react";
import { TrainingStatusCard } from "@/components/training/training-status-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Cpu } from "lucide-react";
import Link from "next/link";

interface TrainingJob {
  id: string;
  status: string;
  triggerWord: string;
  photoCount: number;
  loraWeightsUrl: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  _count?: { generatedImages: number };
}

export default function TrainingPage() {
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/training");
      const data = await res.json();
      if (res.ok) setJobs(data.jobs);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  // Poll for active jobs
  useEffect(() => {
    fetchJobs();

    const interval = setInterval(() => {
      fetchJobs();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Also poll individual active jobs more aggressively
  useEffect(() => {
    const activeJobs = jobs.filter(
      (j) => !["succeeded", "failed", "canceled"].includes(j.status)
    );

    if (activeJobs.length === 0) return;

    const pollActive = async () => {
      for (const job of activeJobs) {
        try {
          const res = await fetch(`/api/training/${job.id}`);
          const updated = await res.json();
          if (res.ok) {
            setJobs((prev) =>
              prev.map((j) => (j.id === updated.id ? updated : j))
            );
          }
        } catch {
          // continue
        }
      }
    };

    const interval = setInterval(pollActive, 10000);
    return () => clearInterval(interval);
  }, [jobs]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Training</h1>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Training</h1>
        <Link href="/upload">
          <Button variant="outline" className="gap-2">
            <Cpu className="h-4 w-4" />
            New Training
          </Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <Cpu className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium text-muted-foreground">No training jobs yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload photos to start training your first model
          </p>
          <Link href="/upload">
            <Button className="mt-4">Upload Photos</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <TrainingStatusCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
