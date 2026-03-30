import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startGeneration, getPredictionStatus } from "@/lib/replicate";
import { uploadFromUrl } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { prompt, trainingJobId } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!trainingJobId) {
      return NextResponse.json({ error: "Training job ID is required" }, { status: 400 });
    }

    const job = await prisma.trainingJob.findFirst({
      where: { id: trainingJobId, userId, status: "succeeded" },
    });

    if (!job || !job.loraWeightsUrl) {
      return NextResponse.json(
        { error: "No completed training found. Train a model first." },
        { status: 400 }
      );
    }

    const prediction = await startGeneration(job.loraWeightsUrl, prompt);

    const image = await prisma.generatedImage.create({
      data: {
        userId,
        trainingJobId: job.id,
        replicatePredictionId: prediction.id,
        prompt,
        status: prediction.status || "starting",
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json({ error: "Failed to start generation" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const trainingJobId = searchParams.get("trainingJobId");

    const where: Record<string, unknown> = { userId };
    if (trainingJobId) where.trainingJobId = trainingJobId;

    const images = await prisma.generatedImage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { trainingJob: { select: { triggerWord: true } } },
    });

    // Poll for any pending images
    const pendingImages = images.filter(
      (img) => img.replicatePredictionId && !["succeeded", "failed"].includes(img.status)
    );

    for (const img of pendingImages) {
      try {
        const prediction = await getPredictionStatus(img.replicatePredictionId!);
        const updateData: Record<string, unknown> = { status: prediction.status };

        if (prediction.status === "succeeded" && prediction.output) {
          const outputUrl = Array.isArray(prediction.output)
            ? prediction.output[0]
            : prediction.output;

          if (typeof outputUrl === "string") {
            // Upload to Cloudinary for permanent storage
            const cloudResult = await uploadFromUrl(
              outputUrl,
              `lora-generated/${userId}`
            );
            updateData.cloudinaryUrl = cloudResult.url;
            updateData.cloudinaryId = cloudResult.publicId;
          }
        }

        if (prediction.status === "failed") {
          updateData.errorMessage = prediction.error || "Generation failed";
        }

        await prisma.generatedImage.update({
          where: { id: img.id },
          data: updateData,
        });
      } catch {
        // Continue with other images if one fails
      }
    }

    // Re-fetch to get updated data
    const updatedImages = await prisma.generatedImage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { trainingJob: { select: { triggerWord: true } } },
    });

    return NextResponse.json({ images: updatedImages });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
