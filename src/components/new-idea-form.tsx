"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createIdeaOptimistic } from "@/app/actions";
import { IdeaCard, type IdeaCardData } from "@/components/idea-card";
import { OptimisticToast } from "@/components/optimistic-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ExecutionPermission, IdeaType, IdeaVisibility } from "@/lib/database.types";

const saveErrorMessage = "保存に失敗しました。もう一度お試しください";

type NewIdeaFormProps = {
  canUseSerious: boolean;
  currentUserId: string;
};

export function NewIdeaForm({ canUseSerious, currentUserId }: NewIdeaFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [optimisticIdea, setOptimisticIdea] = useState<IdeaCardData | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showSaveError() {
    setToast(saveErrorMessage);
    window.setTimeout(() => setToast(null), 3200);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const type = String(formData.get("type") ?? "rough") as IdeaType;
    const visibility = String(formData.get("visibility") ?? "public") as IdeaVisibility;
    const executionPermission = String(formData.get("execution_permission") ?? "public") as ExecutionPermission;
    if (!title || !body) return;

    const now = new Date().toISOString();
    const temporaryIdea: IdeaCardData = {
      id: `temp-${crypto.randomUUID()}`,
      user_id: currentUserId,
      title,
      body,
      type,
      status: "active",
      status_before_archive: null,
      source: "manual",
      visibility,
      execution_permission: visibility === "private" ? "owner_only" : executionPermission,
      image_url: null,
      image_urls: null,
      created_at: now,
      updated_at: now,
      profiles: null,
      likes: [{ count: 0 }],
      comments: [{ count: 0 }],
      executions: [{ count: 0 }],
    };

    setIsSaving(true);
    setOptimisticIdea(temporaryIdea);
    const result = await createIdeaOptimistic(formData);
    setIsSaving(false);

    if (!result.ok) {
      setOptimisticIdea(null);
      showSaveError();
      return;
    }

    setOptimisticIdea(result.data);
    form.reset();
    router.push("/ideas");
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {!canUseSerious ? (
          <div className="rounded-md border bg-muted px-4 py-3 text-sm leading-6 text-muted-foreground">
            新規ユーザーは、まず「アイデア枠」から投稿できます。プロジェクト枠は活動実績が増えると使えるようになります。
          </div>
        ) : null}
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            タイトル
          </label>
          <Input id="title" name="title" required maxLength={120} placeholder="例: 空いている会議室を集中部屋にする" className="min-h-11" disabled={isSaving} />
        </div>
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium">
            投稿タイプ
          </label>
          <select
            id="type"
            name="type"
            className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue="rough"
            disabled={isSaving}
          >
            <option value="rough">💡 アイデア枠</option>
            <option value="serious" disabled={!canUseSerious}>
              🚀 プロジェクト枠
            </option>
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="body" className="text-sm font-medium">
            内容
          </label>
          <Textarea id="body" name="body" required placeholder="背景、誰の課題か、どう実行できそうかを書いてください。" className="min-h-36" disabled={isSaving} />
        </div>
        <div className="space-y-2">
          <label htmlFor="images" className="text-sm font-medium">
            画像を添付
          </label>
          <Input id="images" name="images" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple className="min-h-11" disabled={isSaving} />
          <p className="text-xs text-muted-foreground">PNG / JPEG / WebP / GIF、最大4枚、1枚5MBまで。</p>
        </div>
        <div className="space-y-3">
          <div className="text-sm font-medium">公開範囲</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
              <input type="radio" name="visibility" value="public" defaultChecked className="mt-1" disabled={isSaving} />
              <span>
                <span className="block font-medium">公開フィードに投稿</span>
                <span className="text-sm leading-6 text-muted-foreground">全ユーザーが閲覧でき、コメントや実行報告の対象になります。</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
              <input type="radio" name="visibility" value="private" className="mt-1" disabled={isSaving} />
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
              <input type="radio" name="execution_permission" value="owner_only" className="mt-1" disabled={isSaving} />
              <span>
                <span className="block font-medium">自分だけが実行する</span>
                <span className="text-sm leading-6 text-muted-foreground">個人的な行動メモや自己改善向け。</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
              <input type="radio" name="execution_permission" value="public" defaultChecked className="mt-1" disabled={isSaving} />
              <span>
                <span className="block font-medium">誰でも実行できる</span>
                <span className="text-sm leading-6 text-muted-foreground">共同開発や社会的なアイデア向け。</span>
              </span>
            </label>
          </div>
        </div>
        <Button type="submit" className="min-h-11 w-full sm:w-auto" disabled={isSaving}>
          {isSaving ? "保存中..." : "投稿する"}
        </Button>
      </form>

      {optimisticIdea ? (
        <div className="mt-6 space-y-3">
          <div className="text-sm font-medium text-muted-foreground">{isSaving ? "保存中の投稿" : "投稿しました"}</div>
          <IdeaCard currentUserId={currentUserId} idea={optimisticIdea} showExecutionReportAction={false} />
        </div>
      ) : null}
      <OptimisticToast message={toast} />
    </>
  );
}
