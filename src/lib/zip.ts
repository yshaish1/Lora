import archiver from "archiver";
import { Readable } from "stream";

export async function createTrainingZip(
  imageUrls: string[]
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 5 } });
    const chunks: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    for (let i = 0; i < imageUrls.length; i++) {
      const response = await fetch(imageUrls[i]);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const ext = imageUrls[i].match(/\.(jpg|jpeg|png|webp)/i)?.[1] || "jpg";
      archive.append(buffer, { name: `photo_${i}.${ext}` });
    }

    archive.finalize();
  });
}
