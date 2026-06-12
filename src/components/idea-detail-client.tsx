"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import { Archive, CheckCircle2, Edit3, Heart, ImagePlus, MessageCircle, Rocket, RotateCcw, ShieldAlert, Trash2, X } from "lucide-react";
import {
  addCommentOptimistic,
  archiveIdeaOptimistic,
  deleteCommentOptimistic,
  deleteArchivedIdeaOptimistic,
  markExecutionReport,
  reportTarget,
  setLikeOptimistic,
  unarchiveIdeaOptimistic,
  updateIdeaStatusOptimistic,
} from "@/app/actions";
import { IdeaImageGrid } from "@/components/idea-image-grid";
import { OptimisticToast } from "@/components/optimistic-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { ExecutionKind, ExecutionPermission, IdeaSource, IdeaStatus, IdeaVisibility } from "@/lib/database.types";

const saveErrorMessage = "投稿に失敗しました。時間をおいて再試行してください";

export type ProfileLite = { id: string; username: string | null; display_name: string | null; credit_score?: number };

export type IdeaDetailData = {
  id: string;
  title: string;
  body: string;
  type: "rough" | "serious";
  status: IdeaStatus;
  status_before_archive: Exclude<IdeaStatus, "archived"> | null;
  source: IdeaSource;
  visibility: IdeaVisibility;
  execution_permission: ExecutionPermission;
  image_url: string | null;
  image_urls: string[] | null;
  archived_at: string | null;
  hidden_at: string | null;
  delete_scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles: ProfileLite | null;
  likes_count: number;
  executions_count: number;
};

export type CommentData = {
  id: string;
  body: string;
  image_path: string | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles: ProfileLite | ProfileLite[] | null;
  likes_count: number;
};

export type ExecutionData = {
  id: string;
  kind: ExecutionKind;
  note: string | null;
  created_at: string;
  profiles: ProfileLite | ProfileLite[] | null;
};

type IdeaDetailClientProps = {
  canReportExecution: boolean;
  comments: CommentData[];
  currentUserId?: string;
  currentUserProfile: ProfileLite | null;
  executions: ExecutionData[];
  idea: IdeaDetailData;
  imageUrls: string[];
  initialLiked: boolean;
  initialLikedCommentIds: string[];
  isAuthor: boolean;
};

function getProfile(profile: ProfileLite | ProfileLite[] | null | undefined) {
  return Array.isArray(profile) ? profile[0] : profile;
}

function getProfileName(profile: ProfileLite | ProfileLite[] | null | undefined) {
  const normalizedProfile = getProfile(profile);
  return normalizedProfile?.display_name || normalizedProfile?.username || "匿名ユーザー";
}

function getProfileId(profile: ProfileLite | ProfileLite[] | null | undefined, fallbackId: string) {
  return getProfile(profile)?.id || fallbackId;
}

function ideaTypeLabel(type: "rough" | "serious") {
  return type === "serious" ? "🚀 プロジェクト枠" : "💡 アイデア枠";
}

export function IdeaDetailClient({
  canReportExecution,
  comments: initialComments,
  currentUserId,
  currentUserProfile,
  executions: initialExecutions,
  idea: initialIdea,
  imageUrls,
  initialLiked,
  initialLikedCommentIds,
  isAuthor,
}: IdeaDetailClientProps) {
  const router = useRouter();
  const [idea, setIdea] = useState(initialIdea);
  const [comments, setComments] = useState(initialComments);
  const [executions, setExecutions] = useState(initialExecutions);
  const [liked, setLiked] = useState(initialLiked);
  const [likedCommentIds, setLikedCommentIds] = useState(() => new Set(initialLikedCommentIds));
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [commentImageInputKey, setCommentImageInputKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const isArchived = idea.status === "archived";
  const isCompleted = idea.status === "completed";
  const isSelfImprovement = idea.source === "mental_seesaw";
  const returnPath = `/ideas/${idea.id}`;

  function showSaveError() {
    setToast(saveErrorMessage);
    window.setTimeout(() => setToast(null), 3200);
  }

  async function handleIdeaLike() {
    if (pendingAction || !currentUserId) return;
    const previousLiked = liked;
    const previousCount = idea.likes_count;
    const nextLiked = !liked;
    setPendingAction("idea-like");
    setLiked(nextLiked);
    setIdea((current) => ({ ...current, likes_count: Math.max(0, current.likes_count + (nextLiked ? 1 : -1)) }));
    const result = await setLikeOptimistic("idea", idea.id, nextLiked, returnPath);
    setPendingAction(null);
    if (!result.ok) {
      setLiked(previousLiked);
      setIdea((current) => ({ ...current, likes_count: previousCount }));
      showSaveError();
    }
  }

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingAction || !currentUserId || !commentBody.trim()) return;
    const formData = new FormData();
    formData.set("body", commentBody.trim());
    if (commentImage) formData.set("image", commentImage);

    const temporaryId = `temp-${crypto.randomUUID()}`;
    const optimisticComment: CommentData = {
      id: temporaryId,
      body: commentBody.trim(),
      image_path: null,
      image_url: commentImagePreview,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      profiles: currentUserProfile,
      likes_count: 0,
    };
    const previousComments = comments;
    setPendingAction("comment");
    setComments((current) => [...current, optimisticComment]);
    setCommentBody("");
    setCommentImage(null);
    setCommentImagePreview(null);
    setCommentImageInputKey((current) => current + 1);

    const result = await addCommentOptimistic(idea.id, formData);
    setPendingAction(null);
    if (!result.ok) {
      console.error("[IdeaDetailClient] comment submit failed", { error: result.error, ideaId: idea.id });
      setComments(previousComments);
      setCommentBody(optimisticComment.body);
      setCommentImage(commentImage);
      setCommentImagePreview(commentImagePreview);
      showSaveError();
      return;
    }

    setComments((current) => current.map((comment) => (comment.id === temporaryId ? result.data : comment)));
  }

  function handleCommentImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setCommentImage(null);
      setCommentImagePreview(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      showSaveError();
      event.target.value = "";
      return;
    }
    setCommentImage(file);
    setCommentImagePreview(URL.createObjectURL(file));
  }

  function clearCommentImage() {
    setCommentImage(null);
    setCommentImagePreview(null);
    setCommentImageInputKey((current) => current + 1);
  }

  async function handleCommentDelete(commentId: string) {
    if (pendingAction || commentId.startsWith("temp-") || !window.confirm("このコメントを削除します。よろしいですか？")) return;
    const previousComments = comments;
    setPendingAction(`comment-delete-${commentId}`);
    setComments((current) => current.filter((comment) => comment.id !== commentId));
    const result = await deleteCommentOptimistic(commentId);
    setPendingAction(null);
    if (!result.ok) {
      console.error("[IdeaDetailClient] comment delete failed", { commentId, error: result.error });
      setComments(previousComments);
      showSaveError();
    }
  }

  async function handleCommentLike(commentId: string) {
    if (pendingAction || !currentUserId || commentId.startsWith("temp-")) return;
    const wasLiked = likedCommentIds.has(commentId);
    const nextLiked = !wasLiked;
    const previousLikedCommentIds = new Set(likedCommentIds);
    const previousComments = comments;
    setPendingAction(`comment-like-${commentId}`);
    setLikedCommentIds((current) => {
      const next = new Set(current);
      if (nextLiked) next.add(commentId);
      else next.delete(commentId);
      return next;
    });
    setComments((current) =>
      current.map((comment) =>
        comment.id === commentId ? { ...comment, likes_count: Math.max(0, comment.likes_count + (nextLiked ? 1 : -1)) } : comment,
      ),
    );

    const result = await setLikeOptimistic("comment", commentId, nextLiked, returnPath);
    setPendingAction(null);
    if (!result.ok) {
      setLikedCommentIds(previousLikedCommentIds);
      setComments(previousComments);
      showSaveError();
    }
  }

  async function handleStatus(status: Exclude<IdeaStatus, "archived">) {
    if (pendingAction) return;
    const previousIdea = idea;
    const previousExecutions = executions;
    setPendingAction(status);
    setIdea((current) => ({
      ...current,
      status,
      status_before_archive: null,
      updated_at: new Date().toISOString(),
      executions_count: status === "completed" ? Math.max(1, current.executions_count) : Math.max(0, current.executions_count - 1),
    }));
    setExecutions((current) =>
      status === "completed"
        ? [
            {
              id: `temp-execution-${crypto.randomUUID()}`,
              kind: "self",
              note: "自分で実行しました",
              created_at: new Date().toISOString(),
              profiles: currentUserProfile,
            },
            ...current.filter((execution) => getProfileId(execution.profiles, "") !== currentUserId),
          ]
        : current.filter((execution) => !(execution.kind === "self" && getProfileId(execution.profiles, "") === currentUserId)),
    );

    const result = await updateIdeaStatusOptimistic(idea.id, status);
    setPendingAction(null);
    if (!result.ok) {
      setIdea(previousIdea);
      setExecutions(previousExecutions);
      showSaveError();
    }
  }

  async function handleArchive() {
    if (pendingAction) return;
    const previousIdea = idea;
    setPendingAction("archive");
    setIdea((current) => ({
      ...current,
      status: "archived",
      status_before_archive: current.status === "completed" ? "completed" : "active",
      updated_at: new Date().toISOString(),
    }));
    const result = await archiveIdeaOptimistic(idea.id);
    setPendingAction(null);
    if (!result.ok) {
      setIdea(previousIdea);
      showSaveError();
    }
  }

  async function handleUnarchive() {
    if (pendingAction) return;
    const previousIdea = idea;
    setPendingAction("unarchive");
    setIdea((current) => ({ ...current, status: current.status_before_archive ?? "active", status_before_archive: null }));
    const result = await unarchiveIdeaOptimistic(idea.id);
    setPendingAction(null);
    if (!result.ok) {
      setIdea(previousIdea);
      showSaveError();
      return;
    }
    setIdea((current) => ({ ...current, status: result.data.status }));
  }

  async function handleDelete() {
    if (pendingAction || !window.confirm("このアイデアを完全に削除します。よろしいですか？")) return;
    setPendingAction("delete");
    router.push("/ideas?box=archived");
    const result = await deleteArchivedIdeaOptimistic(idea.id);
    setPendingAction(null);
    if (!result.ok) {
      showSaveError();
    }
  }

  const disabled = Boolean(pendingAction);

  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
      <article className="space-y-6">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={idea.type === "serious" ? "default" : "secondary"}>{ideaTypeLabel(idea.type)}</Badge>
              {isSelfImprovement ? <Badge variant="secondary">自己改善</Badge> : null}
              <Badge variant={idea.visibility === "public" ? "outline" : "secondary"}>{idea.visibility === "public" ? "公開" : "非公開"}</Badge>
              <Badge variant="outline">{idea.execution_permission === "owner_only" ? "投稿者のみ実行可" : "誰でも実行可"}</Badge>
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
              <span className="text-sm text-muted-foreground">{formatDate(idea.created_at)}</span>
              <span className="text-sm text-muted-foreground">最終更新 {formatDate(idea.updated_at)}</span>
            </div>
            <CardTitle className="break-words text-3xl leading-tight">{idea.title}</CardTitle>
            <Link href={`/profiles/${getProfileId(idea.profiles, idea.user_id)}`} className="text-sm font-medium hover:text-primary">
              {getProfileName(idea.profiles)}
            </Link>
          </CardHeader>
          <CardContent className="space-y-6">
            <IdeaImageGrid images={imageUrls} />
            <p className="whitespace-pre-wrap break-words leading-8">{idea.body}</p>
            {!isArchived ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant={liked ? "default" : "outline"} size="sm" onClick={handleIdeaLike} disabled={disabled || !currentUserId}>
                  <Heart className="mr-2 h-4 w-4" />
                  {idea.likes_count}
                </Button>
                {canReportExecution ? (
                  <form action={markExecutionReport.bind(null, idea.id)} className="flex gap-2">
                    <input type="hidden" name="note" value="実行しました" />
                    <Button variant="secondary" size="sm">
                      <Rocket className="mr-2 h-4 w-4" />
                      実行報告する
                    </Button>
                  </form>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {!isArchived ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MessageCircle className="h-5 w-5" />
                コメント
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <Textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="アイデアへの感想や改善提案を書く" required />
                {commentImagePreview ? (
                  <div className="relative w-fit max-w-full">
                    <img src={commentImagePreview} alt="" className="max-h-48 max-w-full rounded-md border object-contain" />
                    <Button type="button" variant="outline" size="icon" className="absolute right-2 top-2 bg-background/90" onClick={clearCommentImage} aria-label="画像を取り消す">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    <ImagePlus className="h-4 w-4" />
                    画像を添付
                    <Input key={commentImageInputKey} type="file" name="image" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleCommentImageChange} />
                  </label>
                  <Button type="submit" disabled={disabled || !currentUserId || !commentBody.trim()}>
                    {pendingAction === "comment" ? "投稿中..." : commentImage ? "画像をアップロードして投稿" : "コメントする"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">画像は1枚まで。JPG / PNG / WebP、5MBまで。</p>
              </form>
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-md border bg-background p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                      <Link href={`/profiles/${getProfileId(comment.profiles, comment.user_id)}`} className="font-medium text-foreground hover:text-primary">
                        {getProfileName(comment.profiles)}
                      </Link>
                      <span>{comment.id.startsWith("temp-") ? "保存中..." : formatDate(comment.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{comment.body}</p>
                    {comment.image_url ? <img src={comment.image_url} alt="" className="mt-3 max-h-72 max-w-full rounded-md border object-contain" /> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={likedCommentIds.has(comment.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCommentLike(comment.id)}
                        disabled={disabled || comment.id.startsWith("temp-") || !currentUserId}
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        {comment.likes_count}
                      </Button>
                      {currentUserId === comment.user_id ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleCommentDelete(comment.id)}
                          disabled={disabled || comment.id.startsWith("temp-")}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {pendingAction === `comment-delete-${comment.id}` ? "削除中..." : "削除"}
                        </Button>
                      ) : null}
                      <ReportForm targetType="comment" targetId={comment.id} returnPath={returnPath} />
                    </div>
                  </div>
                ))}
                {!comments.length ? <p className="text-sm text-muted-foreground">まだコメントはありません。</p> : null}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </article>

      <aside className="space-y-4">
        {isAuthor ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">投稿管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isArchived ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/ideas/${idea.id}/edit`}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    編集する
                  </Link>
                </Button>
              ) : null}
              <div className="flex flex-col gap-2">
                {isArchived ? (
                  <>
                    <Button type="button" variant="outline" size="sm" onClick={handleUnarchive} disabled={disabled}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      復元
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={disabled}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      削除
                    </Button>
                  </>
                ) : (
                  <>
                    {isCompleted ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => handleStatus("active")} disabled={disabled}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        未実行に戻す
                      </Button>
                    ) : (
                      <Button type="button" variant="secondary" size="sm" onClick={() => handleStatus("completed")} disabled={disabled}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        自分で実行した
                      </Button>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={handleArchive} disabled={disabled}>
                      <Archive className="mr-2 h-4 w-4" />
                      アーカイブ
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">実行記録</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">合計 {idea.executions_count} 件</div>
            {executions.slice(0, 5).map((execution) => (
              <div key={execution.id} className="rounded-md bg-muted p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{getProfileName(execution.profiles)}</span>
                  <Badge variant="outline">{execution.kind === "self" ? "自分で実行" : "実行報告"}</Badge>
                </div>
                {execution.note ? <div className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{execution.note}</div> : null}
              </div>
            ))}
            {!executions.length ? <p className="text-sm text-muted-foreground">まだ実行記録はありません。</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              通報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReportForm targetType="idea" targetId={idea.id} returnPath={returnPath} expanded />
          </CardContent>
        </Card>
      </aside>
      <OptimisticToast message={toast} />
    </div>
  );
}

function ReportForm({
  targetType,
  targetId,
  returnPath,
  expanded = false,
}: {
  targetType: "idea" | "comment";
  targetId: string;
  returnPath: string;
  expanded?: boolean;
}) {
  return (
    <form action={reportTarget.bind(null, targetType, targetId, returnPath)} className={expanded ? "space-y-3" : ""}>
      {expanded ? <Textarea name="reason" placeholder="通報理由" required /> : <input type="hidden" name="reason" value="不適切なコメントとして通報" />}
      <Button variant={expanded ? "destructive" : "ghost"} size="sm">
        <ShieldAlert className="mr-2 h-4 w-4" />
        通報
      </Button>
    </form>
  );
}
