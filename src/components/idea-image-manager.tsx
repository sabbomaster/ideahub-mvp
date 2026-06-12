"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteIdeaImageOptimistic } from "@/app/actions";
import { OptimisticToast } from "@/components/optimistic-toast";
import { Button } from "@/components/ui/button";

const saveErrorMessage = "保存に失敗しました。もう一度お試しください";

type ManagedImage = {
  path: string;
  url: string;
};

type IdeaImageManagerProps = {
  ideaId: string;
  images: ManagedImage[];
};

export function IdeaImageManager({ ideaId, images: initialImages }: IdeaImageManagerProps) {
  const [images, setImages] = useState(initialImages);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showSaveError() {
    setToast(saveErrorMessage);
    window.setTimeout(() => setToast(null), 3200);
  }

  async function handleDelete(image: ManagedImage) {
    if (pendingPath) return;
    const previousImages = images;
    setPendingPath(image.path);
    setImages((current) => current.filter((currentImage) => currentImage.path !== image.path));
    const result = await deleteIdeaImageOptimistic(ideaId, image.path);
    setPendingPath(null);
    if (!result.ok) {
      setImages(previousImages);
      showSaveError();
    }
  }

  if (!images.length) return null;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {images.map((image, index) => (
          <div key={image.path} className="flex gap-3 rounded-md border p-3">
            <img src={image.url} alt="" className="h-20 w-20 shrink-0 rounded-md border object-cover" />
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
              <span className="text-sm font-medium">画像 {index + 1}</span>
              <Button type="button" variant="ghost" size="sm" className="w-fit text-destructive" onClick={() => handleDelete(image)} disabled={Boolean(pendingPath)}>
                <Trash2 className="mr-2 h-4 w-4" />
                {pendingPath === image.path ? "削除中..." : "削除"}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <OptimisticToast message={toast} />
    </>
  );
}
