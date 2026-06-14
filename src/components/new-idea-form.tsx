"use client";

/* eslint-disable @next/next/no-img-element */
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createIdeaOptimistic } from "@/app/actions";
import { OptimisticToast } from "@/components/optimistic-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { IdeaCardData } from "@/components/idea-card";
import type { ExecutionPermission, IdeaType, IdeaVisibility } from "@/lib/database.types";

const saveErrorMessage = "投稿に失敗しました。時間をおいて再試行してください";

type ProfileLite = { id: string; username: string | null; display_name: string | null };

type Draft = {
  body: string;
  executionPermission: ExecutionPermission;
  title: string;
  type: IdeaType;
  visibility: IdeaVisibility;
};

type NewIdeaFormProps = {
  currentUserId: string;
  currentUserProfile?: ProfileLite | null;
  onIdeaFailed?: (temporaryId: string) => void;
  onIdeaSaved?: (temporaryId: string, idea: IdeaCardData) => void;
  onOptimisticIdea?: (idea: IdeaCardData) => void;
};

type SelectedImage = {
  file: File;
  id: string;
  previewUrl: string;
};

function getImageKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

const emptyDraft: Draft = {
  body: "",
  executionPermission: "public",
  title: "",
  type: "rough",
  visibility: "public",
};

export function NewIdeaForm({ currentUserId, currentUserProfile = null, onIdeaFailed, onIdeaSaved, onOptimisticIdea }: NewIdeaFormProps) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const selectedImagesRef = useRef<SelectedImage[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  function showSaveError() {
    setToast(saveErrorMessage);
    window.setTimeout(() => setToast(null), 3200);
  }

  function updateDraft(nextDraft: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...nextDraft }));
  }

  function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const validFiles = files.filter((file) => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) && file.size <= 5 * 1024 * 1024);
    let skipped = files.length !== validFiles.length;

    setSelectedImages((current) => {
      const existingKeys = new Set(current.map((image) => getImageKey(image.file)));
      const additions: SelectedImage[] = [];

      for (const file of validFiles) {
        const key = getImageKey(file);
        if (existingKeys.has(key)) {
          skipped = true;
          continue;
        }
        if (current.length + additions.length >= 4) {
          skipped = true;
          continue;
        }
        existingKeys.add(key);
        additions.push({
          file,
          id: crypto.randomUUID(),
          previewUrl: URL.createObjectURL(file),
        });
      }

      return additions.length ? [...current, ...additions] : current;
    });

    event.target.value = "";
    if (skipped) showSaveError();
  }

  function removeSelectedImage(imageId: string) {
    setSelectedImages((current) => {
      const removedImage = current.find((image) => image.id === imageId);
      if (removedImage) URL.revokeObjectURL(removedImage.previewUrl);
      return current.filter((image) => image.id !== imageId);
    });
    setFileInputKey((current) => current + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const form = event.currentTarget;
    const submittedImages = selectedImages;
    const formData = new FormData(form);
    formData.delete("images");
    submittedImages.forEach((image) => formData.append("images", image.file));
    const submittedDraft: Draft = {
      title: String(formData.get("title") ?? "").trim(),
      body: String(formData.get("body") ?? "").trim(),
      type: String(formData.get("type") ?? "rough") as IdeaType,
      visibility: String(formData.get("visibility") ?? "public") as IdeaVisibility,
      executionPermission: String(formData.get("execution_permission") ?? "public") as ExecutionPermission,
    };
    if (!submittedDraft.title || !submittedDraft.body) return;

    const now = new Date().toISOString();
    const temporaryIdea: IdeaCardData = {
      id: `temp-${crypto.randomUUID()}`,
      user_id: currentUserId,
      title: submittedDraft.title,
      body: submittedDraft.body,
      type: submittedDraft.type,
      status: "active",
      status_before_archive: null,
      source: "manual",
      visibility: submittedDraft.visibility,
      execution_permission: submittedDraft.visibility === "private" ? "owner_only" : submittedDraft.executionPermission,
      image_url: null,
      image_urls: null,
      created_at: now,
      updated_at: now,
      profiles: currentUserProfile,
      likes: [{ count: 0 }],
      comments: [{ count: 0 }],
      executions: [{ count: 0 }],
    };

    setIsSaving(true);
    setDraft(emptyDraft);
    setSelectedImages([]);
    setFileInputKey((current) => current + 1);
    onOptimisticIdea?.(temporaryIdea);

    let result: Awaited<ReturnType<typeof createIdeaOptimistic>>;
    try {
      result = await createIdeaOptimistic(formData);
    } catch (error) {
      console.error("[NewIdeaForm] idea submit failed", { error });
      result = { ok: false, error: saveErrorMessage };
    } finally {
      setIsSaving(false);
    }

    if (!result.ok) {
      onIdeaFailed?.(temporaryIdea.id);
      setDraft(submittedDraft);
      setSelectedImages(submittedImages);
      showSaveError();
      return;
    }

    submittedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    onIdeaSaved?.(temporaryIdea.id, { ...result.data, profiles: currentUserProfile });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isSaving}>
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            タイトル
          </label>
          <Input
            id="title"
            name="title"
            required
            maxLength={120}
            value={draft.title}
            onChange={(event) => updateDraft({ title: event.target.value })}
            placeholder="例: 空いている会議室を集中部屋にする"
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium">
            投稿タイプ
          </label>
          <select
            id="type"
            name="type"
            className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={draft.type}
            onChange={(event) => updateDraft({ type: event.target.value as IdeaType })}
          >
            <option value="rough">💡 アイデア枠</option>
            <option value="serious">
              🚀 プロジェクト枠
            </option>
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="body" className="text-sm font-medium">
            内容
          </label>
          <Textarea
            id="body"
            name="body"
            required
            value={draft.body}
            onChange={(event) => updateDraft({ body: event.target.value })}
            placeholder="背景、誰の課題か、どう実行できそうかを書いてください。"
            className="min-h-36"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="images" className="text-sm font-medium">
            画像を添付
          </label>
          <Input
            key={fileInputKey}
            id="images"
            name="images"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="min-h-11"
            onChange={handleImagesChange}
          />
          <p className="text-xs text-muted-foreground">PNG / JPEG / WebP / GIF、最大4枚、1枚5MBまで。</p>
          {selectedImages.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {selectedImages.map((image, index) => (
                <div key={image.id} className="relative overflow-hidden rounded-md border bg-muted">
                  <img src={image.previewUrl} alt={`選択した画像 ${index + 1}`} className="aspect-square w-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-10 w-10 rounded-full shadow-md"
                    onClick={() => removeSelectedImage(image.id)}
                    aria-label={`画像 ${index + 1} を削除`}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="space-y-3">
          <div className="text-sm font-medium">公開範囲</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={draft.visibility === "public"}
                onChange={() => updateDraft({ visibility: "public" })}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">公開フィードに投稿</span>
                <span className="text-sm leading-6 text-muted-foreground">全ユーザーが閲覧でき、コメントや実行報告の対象になります。</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={draft.visibility === "private"}
                onChange={() => updateDraft({ visibility: "private" })}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">マイアイデアに保存</span>
                <span className="text-sm leading-6 text-muted-foreground">自分だけが見られる個人メモや下書きとして保存します。</span>
              </span>
            </label>
          </div>
        </div>
        <div className="space-y-3">
          <div className="text-sm font-medium">実行権限</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
              <input
                type="radio"
                name="execution_permission"
                value="owner_only"
                checked={draft.executionPermission === "owner_only"}
                onChange={() => updateDraft({ executionPermission: "owner_only" })}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">自分だけが実行する</span>
                <span className="text-sm leading-6 text-muted-foreground">個人的な行動メモや自己改善向け。</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
              <input
                type="radio"
                name="execution_permission"
                value="public"
                checked={draft.executionPermission === "public"}
                onChange={() => updateDraft({ executionPermission: "public" })}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">誰でも実行できる</span>
                <span className="text-sm leading-6 text-muted-foreground">共同開発や社会的なアイデア向け。</span>
              </span>
            </label>
          </div>
        </div>
        <Button type="submit" className="min-h-11 w-full sm:w-auto" disabled={isSaving}>
          {isSaving ? "投稿中..." : "投稿する"}
        </Button>
      </form>
      <OptimisticToast message={toast} />
    </>
  );
}
