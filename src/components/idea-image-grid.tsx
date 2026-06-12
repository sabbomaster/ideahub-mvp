"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IdeaImageGridProps = {
  images: string[];
};

export function IdeaImageGrid({ images }: IdeaImageGridProps) {
  const visibleImages = images.filter(Boolean).slice(0, 4);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") setActiveIndex((current) => (current === null ? current : (current - 1 + visibleImages.length) % visibleImages.length));
      if (event.key === "ArrowRight") setActiveIndex((current) => (current === null ? current : (current + 1) % visibleImages.length));
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, visibleImages.length]);

  if (!visibleImages.length) return null;

  const activeImage = activeIndex === null ? null : visibleImages[activeIndex];
  const move = (step: number) => {
    setActiveIndex((current) => (current === null ? current : (current + step + visibleImages.length) % visibleImages.length));
  };

  return (
    <>
      <div
        className={cn(
          "grid w-full overflow-hidden rounded-md border bg-muted",
          visibleImages.length === 1 && "grid-cols-1",
          visibleImages.length === 2 && "grid-cols-2",
          visibleImages.length >= 3 && "grid-cols-2",
        )}
      >
        {visibleImages.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              "relative min-h-0 overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              visibleImages.length === 1 && "aspect-video",
              visibleImages.length === 2 && "aspect-square",
              visibleImages.length === 3 && index === 0 && "aspect-video sm:row-span-2 sm:aspect-auto",
              visibleImages.length === 3 && index > 0 && "aspect-square",
              visibleImages.length >= 4 && "aspect-square",
            )}
            aria-label={`画像${index + 1}を開く`}
          >
            <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.02]" />
          </button>
        ))}
      </div>

      {activeImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-6" role="dialog" aria-modal="true">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setActiveIndex(null)}
            className="absolute right-3 top-3 z-10 border-white/30 bg-black/30 text-white hover:bg-white hover:text-black"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </Button>

          {visibleImages.length > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => move(-1)}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 border-white/30 bg-black/30 text-white hover:bg-white hover:text-black"
              aria-label="前の画像"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          ) : null}

          <img src={activeImage} alt="" className="max-h-[86vh] max-w-full rounded-md object-contain" />

          {visibleImages.length > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => move(1)}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 border-white/30 bg-black/30 text-white hover:bg-white hover:text-black"
              aria-label="次の画像"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          ) : null}

          {activeIndex !== null ? (
            <div className="absolute bottom-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
              {activeIndex + 1} / {visibleImages.length}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
