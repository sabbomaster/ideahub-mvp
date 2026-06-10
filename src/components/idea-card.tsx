/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Archive, CheckCircle2, Heart, MessageCircle, Rocket, RotateCcw } from "lucide-react";
import { archiveIdea, markExecutionReport, selfExecuteIdea, unarchiveIdea, updateIdeaStatus } from "@/app/actions";
import { DeleteIdeaButton } from "@/components/delete-idea-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { ExecutionPermission, IdeaSource, IdeaStatus, IdeaType, IdeaVisibility } from "@/lib/database.types";

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
  archived_at?: string | null;
  hidden_at?: string | null;
  delete_scheduled_at?: string | null;
  created_at: string;
  updated_at: string;
  profiles: { id: string; username: string | null; display_name: string | null; credit_score: number } | null;
  likes: { count: number }[];
  comments: { count: number }[];
  executions: { count: number }[];
};

type IdeaCardProps = {
  currentUserId?: string | null;
  idea: IdeaCardData;
  showExecutionReportAction?: boolean;
};

export function IdeaCard({ currentUserId, idea, showExecutionReportAction = true }: IdeaCardProps) {
  const author = idea.profiles?.display_name || idea.profiles?.username || "匿名ユーザー";
  const isCompleted = idea.status === "completed";
  const isArchived = idea.status === "archived";
  const isSelfImprovement = idea.source === "mental_seesaw";
  const visibility = idea.visibility ?? "public";
  const executionPermission = idea.execution_permission ?? "public";
  const canManage = currentUserId === idea.user_id;

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={idea.type === "serious" ? "default" : "secondary"}>
            {idea.type === "serious" ? "本気枠" : "思いつき枠"}
          </Badge>
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
          <span className="text-sm text-muted-foreground">{formatDate(idea.created_at)}</span>
          <span className="text-sm text-muted-foreground">最終更新 {formatDate(idea.updated_at)}</span>
        </div>
        <CardTitle className="leading-snug">
          <Link href={`/ideas/${idea.id}`} className="hover:text-primary">
            {idea.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {idea.image_url ? <img src={idea.image_url} alt="" className="aspect-video w-full rounded-md border object-cover" /> : null}
        <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{idea.body}</p>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <Link href={`/profiles/${idea.profiles?.id ?? ""}`} className="font-medium text-foreground hover:text-primary">
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
        {canManage ? (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            {isArchived ? (
              <>
                <form action={unarchiveIdea.bind(null, idea.id)}>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    復元
                  </Button>
                </form>
                <DeleteIdeaButton ideaId={idea.id} />
              </>
            ) : (
              <>
                {isCompleted ? (
                  <form action={updateIdeaStatus.bind(null, idea.id, "active")}>
                    <Button variant="outline" size="sm">
                      未実行に戻す
                    </Button>
                  </form>
                ) : (
                  <form action={selfExecuteIdea.bind(null, idea.id)}>
                    <Button variant="secondary" size="sm">
                      自分で実行した
                    </Button>
                  </form>
                )}
                <form action={archiveIdea.bind(null, idea.id)}>
                  <Button variant="outline" size="sm">
                    <Archive className="mr-2 h-4 w-4" />
                    アーカイブ
                  </Button>
                </form>
              </>
            )}
          </div>
        ) : null}
        {showExecutionReportAction && !canManage && currentUserId && !isArchived && visibility === "public" && !isSelfImprovement && executionPermission === "public" ? (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <form action={markExecutionReport.bind(null, idea.id)}>
              <input type="hidden" name="note" value="実行しました" />
              <Button variant="secondary" size="sm">
                <Rocket className="mr-2 h-4 w-4" />
                実行報告する
              </Button>
            </form>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
