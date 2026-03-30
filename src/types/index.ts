import { User, TrainingJob, GeneratedImage, UploadedPhoto } from "@prisma/client";

export type SafeUser = Omit<User, "hashedPassword">;

export type TrainingJobWithCount = TrainingJob & {
  _count?: { generatedImages: number };
};

export type GeneratedImageWithTraining = GeneratedImage & {
  trainingJob: Pick<TrainingJob, "triggerWord">;
};

export type UploadedPhotoResponse = Pick<
  UploadedPhoto,
  "id" | "cloudinaryUrl" | "originalName" | "createdAt"
>;
