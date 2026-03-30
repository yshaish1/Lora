import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startTraining } from "@/lib/replicate";
import { createTrainingZip } from "@/lib/zip";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json().catch(() => ({}));
    const triggerWord = body.triggerWord || "TOK";

    const photos = await prisma.uploadedPhoto.findMany({ where: { userId } });

    if (photos.length < 5) {
      return NextResponse.json(
        { error: "You need at least 5 uploaded photos to start training" },
        { status: 400 }
      );
    }

    // Check for existing active training
    const activeTraining = await prisma.trainingJob.findFirst({
      where: {
        userId,
        status: { in: ["pending", "starting", "processing"] },
      },
    });
    if (activeTraining) {
      return NextResponse.json(
        { error: "You already have a training job in progress" },
        { status: 409 }
      );
    }

    // Create ZIP from uploaded photos
    const imageUrls = photos.map((p) => p.cloudinaryUrl);
    const zipBuffer = await createTrainingZip(imageUrls);

    // Upload ZIP as a data URL for Replicate (they accept base64 data URIs)
    const zipBase64 = zipBuffer.toString("base64");
    const zipDataUri = `data:application/zip;base64,${zipBase64}`;

    // Start training on Replicate
    const training = await startTraining(zipDataUri, triggerWord);

    const job = await prisma.trainingJob.create({
      data: {
        userId,
        replicateTrainingId: training.id,
        status: training.status || "starting",
        triggerWord,
        photoCount: photos.length,
        startedAt: new Date(),
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Training error:", error);
    return NextResponse.json({ error: "Failed to start training" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const jobs = await prisma.trainingJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { generatedImages: true } } },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch training jobs" }, { status: 500 });
  }
}
