/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import Link from "next/link";
import { Archive, CheckCircle2, Edit3, Heart, MessageCircle, Rocket, RotateCcw, ShieldAlert } from "lucide-react";
import { addComment, archiveIdea, markExecutionReport, reportTarget, selfExecuteIdea, toggleLike, unarchiveIdea, updateIdeaStatus } from "@/app/actions";
import { DeleteIdeaButton } from "@/components/delete-idea-button";
import { IdeaImageGrid } from "@/components/idea-image-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { ExecutionKind, ExecutionPermission, IdeaSource, IdeaStatus, IdeaVisibility } from "@/lib/database.types";

type IdeaDetailData = {
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
  profiles: { id: string; username: string | null; display_name: string | null; credit_score: number } | null;
  likes_count: number;
  executions_count: number;
};

type CommentData = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profiles: { id: string; username: string | null; display_name: string | null; credit_score: number } | null;
  likes_count: number;
};

type ExecutionData = {
  id: string;
  kind: ExecutionKind;
  note: string | null;
  created_at: string;
  profiles: { id: string; username: string | null; display_name: string | null } | null;
};

const errorMessages: Record<string, string> = {
  comment: "コメントを入力してください。",
  comment_rate: "短時間にコメントが続いています。少し時間を置いてから投稿してください。",
  execution: "このアイデアでは、その実行操作はできません。",
};

export default async function IdeaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ideaResult } = await supabase
    .from("ideas")
    .select("id,title,body,type,status,status_before_archive,source,visibility,execution_permission,image_url,image_urls,archived_at,hidden_at,delete_scheduled_at,created_at,updated_at,user_id,profiles(id,username,display_name,credit_score)")
    .eq("id", id)
    .single();

  const idea = ideaResult as unknown as IdeaDetailData | null;
  if (!idea) notFound();

  const isAuthor = user?.id === idea.user_id;
  const isArchived = idea.status === "archived";
  const isCompleted = idea.status === "completed";
  const isSelfImprovement = idea.source === "mental_seesaw";
  if (isArchived && !isAuthor) notFound();

  const [{ data: comments }, { data: liked }, { data: executions }] = await Promise.all([
    supabase
      .from("comments")
      .select("id,body,created_at,user_id,profiles(id,username,display_name,credit_score)")
      .eq("idea_id", id)
      .order("created_at", { ascending: true }),
    user
      ? supabase
          .from("likes")
          .select("id")
          .eq("user_id", user.id)
          .eq("target_type", "idea")
          .eq("target_id", id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("executions")
      .select("id,kind,note,created_at,profiles(id,username,display_name)")
      .eq("idea_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const typedExecutions = (executions ?? []) as unknown as ExecutionData[];
  const commentIds = ((comments ?? []) as { id: string }[]).map((comment) => comment.id);
  const [{ data: ideaLikes }, { data: commentLikes }] = await Promise.all([
    supabase.from("likes").select("target_id").eq("target_type", "idea").eq("target_id", id),
    commentIds.length
      ? supabase.from("likes").select("target_id").eq("target_type", "comment").in("target_id", commentIds)
      : Promise.resolve({ data: [] }),
  ]);
  const commentLikeCounts = new Map<string, number>();
  ((commentLikes ?? []) as { target_id: string }[]).forEach((like) => {
    commentLikeCounts.set(like.target_id, (commentLikeCounts.get(like.target_id) ?? 0) + 1);
  });
  const typedComments = ((comments ?? []) as unknown as Omit<CommentData, "likes_count">[]).map((comment) => ({
    ...comment,
    likes_count: commentLikeCounts.get(comment.id) ?? 0,
  }));

  idea.likes_count = ideaLikes?.length ?? 0;
  idea.executions_count = typedExecutions.length;
  const author = idea.profiles?.display_name || idea.profiles?.username || "匿名ユーザー";
  const returnPath = `/ideas/${id}`;
  const canReportExecution = Boolean(user && !isAuthor && !isArchived && idea.visibility === "public" && !isSelfImprovement && idea.execution_permission === "public");
  const imagePaths = [...(idea.image_urls ?? []), ...(idea.image_url ? [idea.image_url] : [])].filter(Boolean);
  const imageUrls = (
    await Promise.all(
      [...new Set(imagePaths)].slice(0, 4).map(async (path) => {
        const { data } = await supabase.storage.from("idea-images").createSignedUrl(path, 60 * 60);
        return data?.signedUrl ?? null;
      }),
    )
  ).filter((url): url is string => Boolean(url));

  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
      <article className="space-y-6">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={idea.type === "serious" ? "default" : "secondary"}>
                {idea.type === "serious" ? "🚀 プロジェクト枠" : "💡 アイデア枠"}
              </Badge>
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
            <CardTitle className="text-3xl leading-tight">{idea.title}</CardTitle>
            <Link href={`/profiles/${idea.profiles?.id ?? idea.user_id}`} className="text-sm font-medium hover:text-primary">
              {author}
            </Link>
          </CardHeader>
          <CardContent className="space-y-6">
            <IdeaImageGrid images={imageUrls} />
            <p className="whitespace-pre-wrap leading-8">{idea.body}</p>
            {!isArchived ? (
              <div className="flex flex-wrap gap-2">
                <form action={toggleLike.bind(null, "idea", id, returnPath)}>
                  <Button variant={liked ? "default" : "outline"} size="sm">
                    <Heart className="mr-2 h-4 w-4" />
                    {idea.likes_count}
                  </Button>
                </form>
                {canReportExecution ? (
                  <form action={markExecutionReport.bind(null, id)} className="flex gap-2">
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
              {error && errorMessages[error] ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMessages[error]}
                </div>
              ) : null}
              <form action={addComment.bind(null, id)} className="space-y-3">
                <Textarea name="body" placeholder="アイデアへの感想や改善案を書く" required />
                <Button type="submit">コメントする</Button>
              </form>
              <div className="space-y-4">
                {typedComments.map((comment) => (
                  <div key={comment.id} className="rounded-md border bg-background p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                      <Link href={`/profiles/${comment.profiles?.id ?? comment.user_id}`} className="font-medium text-foreground hover:text-primary">
                        {comment.profiles?.display_name || comment.profiles?.username || "匿名ユーザー"}
                      </Link>
                      <span>{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">{comment.body}</p>
                    <div className="mt-3 flex gap-2">
                      <form action={toggleLike.bind(null, "comment", comment.id, returnPath)}>
                        <Button variant="outline" size="sm">
                          <Heart className="mr-2 h-4 w-4" />
                          {comment.likes_count}
                        </Button>
                      </form>
                      <ReportForm targetType="comment" targetId={comment.id} returnPath={returnPath} />
                    </div>
                  </div>
                ))}
                {!typedComments.length ? <p className="text-sm text-muted-foreground">まだコメントはありません。</p> : null}
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
                  <Link href={`/ideas/${id}/edit`}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    編集する
                  </Link>
                </Button>
              ) : null}
              <div className="flex flex-col gap-2">
                {isArchived ? (
                  <>
                    <form action={unarchiveIdea.bind(null, id)}>
                      <Button variant="outline" size="sm">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        復元
                      </Button>
                    </form>
                    <DeleteIdeaButton ideaId={id} />
                  </>
                ) : (
                  <>
                    {isCompleted ? (
                      <form action={updateIdeaStatus.bind(null, id, "active")}>
                        <Button variant="outline" size="sm">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          未実行に戻す
                        </Button>
                      </form>
                    ) : (
                      <form action={selfExecuteIdea.bind(null, id)}>
                        <Button variant="secondary" size="sm">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          自分で実行した
                        </Button>
                      </form>
                    )}
                    <form action={archiveIdea.bind(null, id)}>
                      <Button variant="outline" size="sm">
                        <Archive className="mr-2 h-4 w-4" />
                        アーカイブ
                      </Button>
                    </form>
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
            {typedExecutions.slice(0, 5).map((execution) => (
              <div key={execution.id} className="rounded-md bg-muted p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{execution.profiles?.display_name || execution.profiles?.username || "匿名ユーザー"}</span>
                  <Badge variant="outline">{execution.kind === "self" ? "自分で実行" : "実行報告"}</Badge>
                </div>
                {execution.note ? <div className="mt-1 text-muted-foreground">{execution.note}</div> : null}
              </div>
            ))}
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
            <ReportForm targetType="idea" targetId={id} returnPath={returnPath} expanded />
          </CardContent>
        </Card>
      </aside>
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
      {expanded ? (
        <Textarea name="reason" placeholder="通報理由" required />
      ) : (
        <input type="hidden" name="reason" value="不適切なコメントとして通報" />
      )}
      <Button variant={expanded ? "destructive" : "ghost"} size="sm">
        <ShieldAlert className="mr-2 h-4 w-4" />
        通報
      </Button>
    </form>
  );
}
