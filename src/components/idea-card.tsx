"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { Archive, CheckCircle2, Heart, MessageCircle, Rocket, RotateCcw, Trash2 } from "lucide-react";
import {
  archiveIdeaOptimistic,
  deleteArchivedIdeaOptimistic,
  markExecutionReport,
  unarchiveIdeaOptimistic,
  updateIdeaStatusOptimistic,
} from "@/app/actions";
import { IdeaImageGrid } from "@/components/idea-image-grid";
import { OptimisticToast } from "@/components/optimistic-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { ExecutionPermission, IdeaSource, IdeaStatus, IdeaType, IdeaVisibility } from "@/lib/database.types";

const saveErrorMessage = "保存に失敗しました。もう一度お試しください";

export type IdeaCardData = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: IdeaType;
  status?: IdeaStatus;
  status_before_archive?: Exclude<IdeaStatus, "archived"> | null;
  source?: IdeaSource;
  visibility?: IdeaVisibility;
  execution_permission?: ExecutionPermission;
  image_url?: string | null;
  image_urls?: string[] | null;
  created_at: string;
  updated_at: string;
  profiles: { id: string; username: string | null; display_name: string | null } | null;
  likes: { count: number }[];
  comments: { count: number }[];
  executions: { count: number }[];
};

type IdeaCardProps = {
  currentUserId?: string | null;
  idea: IdeaCardData;
  showExecutionReportAction?: boolean;
  variant?: "manage" | "profile";
};

function updateCount(counts: { count: number }[] | undefined, delta: number) {
  return [{ count: Math.max(0, (counts?.[0]?.count ?? 0) + delta) }];
}

export function IdeaCard({ currentUserId, idea: initialIdea, showExecutionReportAction = true, variant = "manage" }: IdeaCardProps) {
  const [idea, setIdea] = useState(initialIdea);
  const [isDeleted, setIsDeleted] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (isDeleted) return null;

  const author = idea.profiles?.display_name || idea.profiles?.username || "匿名ユーザー";
  const isCompleted = idea.status === "completed";
  const isArchived = idea.status === "archived";
  const isSelfImprovement = idea.source === "mental_seesaw";
  const visibility = idea.visibility ?? "public";
  const executionPermission = idea.execution_permission ?? "public";
  const canManage = currentUserId === idea.user_id;
  const showManageActions = variant === "manage" && canManage;

  function showSaveError() {
    setToast(saveErrorMessage);
    window.setTimeout(() => setToast(null), 3200);
  }

  async function runWithRollback(actionKey: string, optimisticUpdate: () => void, save: () => Promise<{ ok: boolean }>) {
    if (pendingAction) return;
    const previousIdea = idea;
    setPendingAction(actionKey);
    optimisticUpdate();
    const result = await save();
    setPendingAction(null);
    if (!result.ok) {
      setIdea(previousIdea);
      setIsDeleted(false);
      showSaveError();
    }
  }

  function handleComplete() {
    void runWithRollback(
      "complete",
      () =>
        setIdea((current) => ({
          ...current,
          status: "completed",
          status_before_archive: null,
          executions: updateCount(current.executions, 1),
          updated_at: new Date().toISOString(),
        })),
      () => updateIdeaStatusOptimistic(idea.id, "completed"),
    );
  }

  function handleUndoComplete() {
    void runWithRollback(
      "active",
      () =>
        setIdea((current) => ({
          ...current,
          status: "active",
          executions: updateCount(current.executions, -1),
          updated_at: new Date().toISOString(),
        })),
      () => updateIdeaStatusOptimistic(idea.id, "active"),
    );
  }

  function handleArchive() {
    void runWithRollback(
      "archive",
      () =>
        setIdea((current) => ({
          ...current,
          status: "archived",
          status_before_archive: current.status === "completed" ? "completed" : "active",
          updated_at: new Date().toISOString(),
        })),
      () => archiveIdeaOptimistic(idea.id),
    );
  }

  async function handleUnarchive() {
    if (pendingAction) return;
    const previousIdea = idea;
    setPendingAction("unarchive");
    setIdea((current) => ({
      ...current,
      status: current.status_before_archive ?? "active",
      status_before_archive: null,
      updated_at: new Date().toISOString(),
    }));
    const result = await unarchiveIdeaOptimistic(idea.id);
    setPendingAction(null);
    if (!result.ok) {
      setIdea(previousIdea);
      showSaveError();
    } else {
      setIdea((current) => ({ ...current, status: result.data.status }));
    }
  }

  async function handleDelete() {
    if (pendingAction || !window.confirm("このアイデアを完全に削除します。よろしいですか？")) return;
    setPendingAction("delete");
    setIsDeleted(true);
    const result = await deleteArchivedIdeaOptimistic(idea.id);
    setPendingAction(null);
    if (!result.ok) {
      setIsDeleted(false);
      showSaveError();
    }
  }

  const disabled = Boolean(pendingAction);

  return (
    <>
      <Card className="w-full min-w-0 transition-colors hover:border-primary/40">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={idea.type === "serious" ? "default" : "secondary"}>{idea.type === "serious" ? "🚀 プロジェクト枠" : "💡 アイデア枠"}</Badge>
            {isSelfImprovement ? <Badge variant="secondary">自己改善</Badge> : null}
            <Badge variant={visibility === "public" ? "outline" : "secondary"}>{visibility === "public" ? "公開" : "非公開"}</Badge>
            <Badge variant="outline">{executionPermission === "owner_only" ? "投稿者のみ実行可" : "誰でも実行可"}</Badge>
            {isCompleted ? (
              <Badge variant="outline">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                自分で実行済み
              </Badge>
            ) : null}
            {isArchived ? (
              <Badge variant="outline">
                <Archive className="mr-1 h-3 w-3" />
                アーカイブ
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
            <span>{formatDate(idea.created_at)}</span>
            <span>最終更新 {formatDate(idea.updated_at)}</span>
          </div>
          <CardTitle className="break-words text-xl leading-snug">
            <Link href={`/ideas/${idea.id}`} className="hover:text-primary">
              {idea.title}
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4">
          <IdeaImageGrid images={idea.image_urls?.length ? idea.image_urls : idea.image_url ? [idea.image_url] : []} />
          <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{idea.body}</p>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/profiles/${idea.profiles?.id ?? currentUserId ?? ""}`} className="break-words font-medium text-foreground hover:text-primary">
              {author}
            </Link>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {idea.likes[0]?.count ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {idea.comments[0]?.count ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <Rocket className="h-4 w-4" />
                {idea.executions[0]?.count ?? 0}
              </span>
            </div>
          </div>
          {variant === "profile" ? (
            <div className="grid grid-cols-3 gap-2 border-t pt-4 text-center text-xs text-muted-foreground">
              <div className="rounded-md bg-muted px-2 py-2">
                <div className="text-base font-semibold text-foreground">{idea.executions[0]?.count ?? 0}</div>
                実行
              </div>
              <div className="rounded-md bg-muted px-2 py-2">
                <div className="text-base font-semibold text-foreground">{idea.likes[0]?.count ?? 0}</div>
                いいね
              </div>
              <div className="rounded-md bg-muted px-2 py-2">
                <div className="text-base font-semibold text-foreground">{idea.comments[0]?.count ?? 0}</div>
                コメント
              </div>
            </div>
          ) : null}
          {showManageActions ? (
            <div className="grid gap-2 border-t pt-4 sm:flex sm:flex-wrap">
              {isArchived ? (
                <>
                  <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleUnarchive} disabled={disabled}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    復元
                  </Button>
                  <Button type="button" variant="destructive" size="sm" className="w-full sm:w-auto" onClick={handleDelete} disabled={disabled}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </Button>
                </>
              ) : (
                <>
                  {isCompleted ? (
                    <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleUndoComplete} disabled={disabled}>
                      未実行に戻す
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" size="sm" className="w-full sm:w-auto" onClick={handleComplete} disabled={disabled}>
                      自分で実行した
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleArchive} disabled={disabled}>
                    <Archive className="mr-2 h-4 w-4" />
                    アーカイブ
                  </Button>
                </>
              )}
            </div>
          ) : null}
          {variant === "manage" && showExecutionReportAction && !canManage && currentUserId && !isArchived && visibility === "public" && !isSelfImprovement && executionPermission === "public" ? (
            <div className="grid gap-2 border-t pt-4 sm:flex sm:flex-wrap">
              <form action={markExecutionReport.bind(null, idea.id)}>
                <input type="hidden" name="note" value="実行しました" />
                <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                  <Rocket className="mr-2 h-4 w-4" />
                  実行報告する
                </Button>
              </form>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <OptimisticToast message={toast} />
    </>
  );
}
