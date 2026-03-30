import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const formData = await req.formData();
    const files = formData.getAll("photos") as File[];

    if (files.length < 5 || files.length > 30) {
      return NextResponse.json(
        { error: "Please upload between 5 and 30 photos" },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only JPEG, PNG, and WebP are allowed.` },
          { status: 400 }
        );
      }
    }

    const uploaded = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      const result = await uploadImage(buffer, `lora-training/${userId}`, filename);

      const photo = await prisma.uploadedPhoto.create({
        data: {
          userId,
          cloudinaryUrl: result.url,
          cloudinaryId: result.publicId,
          originalName: file.name,
        },
      });
      uploaded.push(photo);
    }

    return NextResponse.json({ photos: uploaded, count: uploaded.length });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const photos = await prisma.uploadedPhoto.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}
