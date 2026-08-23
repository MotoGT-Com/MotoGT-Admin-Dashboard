"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { uploadService } from "@/lib/services/upload.service";
import type { CollectionTranslation } from "@/lib/domain/collections";
import { cn } from "@/lib/utils";

interface CollectionDetailsFormProps {
  translations: CollectionTranslation[];
  slug: string;
  imageUrl: string | null;
  onTranslationsChange: (next: CollectionTranslation[]) => void;
  onSlugChange: (slug: string) => void;
  onImageUrlChange: (url: string | null) => void;
}

function upsertTranslation(
  list: CollectionTranslation[],
  languageCode: string,
  patch: Partial<Pick<CollectionTranslation, "title" | "description">>,
): CollectionTranslation[] {
  const existing = list.find((t) => t.languageCode === languageCode);
  if (existing) {
    return list.map((t) =>
      t.languageCode === languageCode ? { ...t, ...patch } : t,
    );
  }
  return [
    ...list,
    {
      languageCode,
      title: patch.title ?? "",
      description: patch.description ?? "",
    },
  ];
}

function getTranslation(
  list: CollectionTranslation[],
  languageCode: string,
): CollectionTranslation {
  return (
    list.find((t) => t.languageCode === languageCode) ?? {
      languageCode,
      title: "",
      description: "",
    }
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to read image"));
    };
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export function CollectionDetailsForm({
  translations,
  slug,
  imageUrl,
  onTranslationsChange,
  onSlugChange,
  onImageUrlChange,
}: CollectionDetailsFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const en = getTranslation(translations, "en");

  const handlePickImage = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validation = uploadService.validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid image");
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onImageUrlChange(dataUrl);
      toast.success("Image added");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageUrlChange(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative shrink-0 w-full sm:w-28">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            className="sr-only"
            onChange={(e) => void handleFileChange(e)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={handlePickImage}
            className={cn(
              "h-28 w-full sm:w-28 rounded-lg border border-dashed border-border bg-muted/40 flex flex-col items-center justify-center gap-1 text-muted-foreground transition overflow-hidden",
              uploading
                ? "opacity-70 cursor-wait"
                : "hover:bg-muted/70 cursor-pointer",
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-xs">Uploading…</span>
              </>
            ) : imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs">Add image</span>
              </>
            )}
          </button>
          {imageUrl && !uploading ? (
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-sm border border-border"
              onClick={handleRemoveImage}
              aria-label="Remove image"
            >
              <X size={14} />
            </Button>
          ) : null}
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="col-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="col-title"
              value={en.title}
              onChange={(e) =>
                onTranslationsChange(
                  upsertTranslation(translations, "en", {
                    title: e.target.value,
                  }),
                )
              }
              placeholder="e.g. Summer Picks"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="col-desc">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="col-desc"
              value={en.description}
              onChange={(e) =>
                onTranslationsChange(
                  upsertTranslation(translations, "en", {
                    description: e.target.value,
                  }),
                )
              }
              rows={3}
              placeholder="Describe this collection for the storefront"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="col-slug">
          Slug <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0">/</span>
          <Input
            id="col-slug"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="summer-picks"
            className="font-mono text-sm"
            required
          />
        </div>
      </div>
    </div>
  );
}
