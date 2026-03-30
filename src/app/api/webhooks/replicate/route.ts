import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFromUrl } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, status, output, error: replicateError } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    // Try to match as a training job first
    const trainingJob = await prisma.trainingJob.findFirst({
      where: { replicateTrainingId: id },
    });

    if (trainingJob) {
      const updateData: Record<string, unknown> = { status };

      if (status === "succeeded" && output?.weights) {
        updateData.loraWeightsUrl = output.weights;
        updateData.completedAt = new Date();
      }

      if (status === "failed") {
        updateData.errorMessage = replicateError || "Training failed";
        updateData.completedAt = new Date();
      }

      await prisma.trainingJob.update({
        where: { id: trainingJob.id },
        data: updateData,
      });

      return NextResponse.json({ ok: true });
    }

    // Try to match as a generated image prediction
    const generatedImage = await prisma.generatedImage.findFirst({
      where: { replicatePredictionId: id },
    });

    if (generatedImage) {
      const updateData: Record<string, unknown> = { status };

      if (status === "succeeded" && output) {
        const outputUrl = Array.isArray(output) ? output[0] : output;
        if (typeof outputUrl === "string") {
          try {
            const cloudResult = await uploadFromUrl(
              outputUrl,
              `lora-generated/${generatedImage.userId}`
            );
            updateData.cloudinaryUrl = cloudResult.url;
            updateData.cloudinaryId = cloudResult.publicId;
          } catch {
            // Store the direct Replicate URL as fallback
            updateData.cloudinaryUrl = outputUrl;
          }
        }
      }

      if (status === "failed") {
        updateData.errorMessage = replicateError || "Generation failed";
      }

      await prisma.generatedImage.update({
        where: { id: generatedImage.id },
        data: updateData,
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "No matching job found" }, { status: 404 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
