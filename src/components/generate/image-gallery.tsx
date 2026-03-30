"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface GeneratedImageItem {
  id: string;
  prompt: string;
  cloudinaryUrl: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

interface ImageGalleryProps {
  images: GeneratedImageItem[];
  isLoading?: boolean;
}

export function ImageGallery({ images, isLoading }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImageItem | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No generated images yet. Enter a prompt above to get started!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <Card
            key={image.id}
            className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => image.cloudinaryUrl && setSelectedImage(image)}
          >
            <div className="aspect-square relative">
              {image.status === "succeeded" && image.cloudinaryUrl ? (
                <Image
                  src={image.cloudinaryUrl}
                  alt={image.prompt}
                  fill
                  className="object-cover"
                />
              ) : image.status === "failed" ? (
                <div className="flex items-center justify-center h-full bg-destructive/10">
                  <Badge variant="destructive">Failed</Badge>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="text-xs text-muted-foreground truncate">{image.prompt}</p>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-normal text-muted-foreground">
              {selectedImage?.prompt}
            </DialogTitle>
          </DialogHeader>
          {selectedImage?.cloudinaryUrl && (
            <div className="relative aspect-square w-full">
              <Image
                src={selectedImage.cloudinaryUrl}
                alt={selectedImage.prompt}
                fill
                className="object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
