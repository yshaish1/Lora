import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTrainingStatus } from "@/lib/replicate";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const job = await prisma.trainingJob.findFirst({
      where: { id: params.id, userId },
    });

    if (!job) {
      return NextResponse.json({ error: "Training job not found" }, { status: 404 });
    }

    // If not terminal, poll Replicate for latest status
    const terminalStatuses = ["succeeded", "failed", "canceled"];
    if (job.replicateTrainingId && !terminalStatuses.includes(job.status)) {
      try {
        const training = await getTrainingStatus(job.replicateTrainingId);

        const updateData: Record<string, unknown> = {
          status: training.status,
        };

        if (training.status === "succeeded" && training.output) {
          const output = training.output as { weights?: string };
          updateData.loraWeightsUrl = output.weights || null;
          updateData.completedAt = new Date();
        }

        if (training.status === "failed") {
          updateData.errorMessage = training.error || "Training failed";
          updateData.completedAt = new Date();
        }

        const updatedJob = await prisma.trainingJob.update({
          where: { id: job.id },
          data: updateData,
        });

        return NextResponse.json(updatedJob);
      } catch {
        // If Replicate API fails, return cached status
      }
    }

    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch training status" }, { status: 500 });
  }
}
