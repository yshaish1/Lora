"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cpu, Clock, ImageIcon } from "lucide-react";
import Link from "next/link";

interface TrainingStatusCardProps {
  job: {
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
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "succeeded":
      return <Badge variant="success">Completed</Badge>;
    case "failed":
    case "canceled":
      return <Badge variant="destructive">{status}</Badge>;
    case "processing":
      return <Badge variant="info">Training...</Badge>;
    case "starting":
    case "pending":
      return <Badge variant="warning">Starting...</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function TrainingStatusCard({ job }: TrainingStatusCardProps) {
  const startTime = job.startedAt ? new Date(job.startedAt) : new Date(job.createdAt);
  const endTime = job.completedAt ? new Date(job.completedAt) : new Date();
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMin = Math.round(durationMs / 60000);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          Training Job
        </CardTitle>
        {getStatusBadge(job.status)}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Trigger Word</p>
            <p className="font-mono font-medium">{job.triggerWord}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Photos</p>
            <p className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {job.photoCount}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Duration</p>
            <p className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {durationMin} min
            </p>
          </div>
          {job._count && (
            <div>
              <p className="text-muted-foreground">Generated</p>
              <p>{job._count.generatedImages} images</p>
            </div>
          )}
        </div>

        {job.errorMessage && (
          <p className="text-sm text-destructive">{job.errorMessage}</p>
        )}

        {job.status === "succeeded" && (
          <Link href="/generate">
            <Button size="sm" className="w-full mt-2">
              Generate Images
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
