"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoGridProps {
  files: File[];
  onRemove: (index: number) => void;
}

export function PhotoGrid({ files, onRemove }: PhotoGridProps) {
  if (files.length === 0) return null;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
      {files.map((file, index) => (
        <div key={`${file.name}-${index}`} className="relative group aspect-square rounded-lg overflow-hidden border">
          <Image
            src={URL.createObjectURL(file)}
            alt={file.name}
            fill
            className="object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(index)}
          >
            <X className="h-3 w-3" />
          </Button>
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
            {file.name}
          </div>
        </div>
      ))}
    </div>
  );
}
