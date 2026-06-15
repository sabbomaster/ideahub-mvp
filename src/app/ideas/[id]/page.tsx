import { notFound } from "next/navigation";
import { IdeaDetailClient, type CommentData, type ExecutionData, type IdeaDetailData, type ProfileLite } from "@/components/idea-detail-client";
import { createClient } from "@/lib/supabase/server";

const errorMessages: Record<string, string> = {
  comment: "コメントを入力してください。",
  comment_rate: "短時間にコメントが続いています。少し時間を置いてから投稿してください。",
  execution: "実行処理に失敗しました。時間を置いてもう一度お試しください。",
  archive: "アーカイブ操作に失敗しました。",
  delete: "削除に失敗しました。",
  status: "状態の変更に失敗しました。",
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
  const isSelfImprovement = idea.source === "mental_seesaw";
  if (isArchived && !isAuthor) notFound();

  const [{ data: comments, error: commentsError }, { data: liked }, { data: executions }, { data: currentUserProfile }] = await Promise.all([
    supabase
      .from("comments")
      .select("id,body,image_path,created_at,user_id")
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
    user ? supabase.from("profiles").select("id,username,display_name,credit_score").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  if (commentsError) {
    console.error("[IdeaDetailPage] failed to fetch comments", {
      error: commentsError.message,
      ideaId: id,
    });
  }
  console.log("server comments", comments);

  const typedExecutions = (executions ?? []) as unknown as ExecutionData[];
  type RawComment = Pick<CommentData, "id" | "body" | "created_at" | "user_id"> & {
    image_path?: string | null;
    profiles?: ProfileLite | ProfileLite[] | null;
  };
  const rawComments = (comments ?? []) as unknown as RawComment[];
  const commentUserIds = [
    ...new Set(
      rawComments
        .map((comment) => comment.user_id)
        .filter((userId): userId is string => typeof userId === "string" && Boolean(userId)),
    ),
  ];
  const { data: commentProfiles, error: commentProfilesError } = commentUserIds.length
    ? await supabase.from("profiles").select("id,username,display_name,credit_score").in("id", commentUserIds)
    : { data: [], error: null };
  if (commentProfilesError) {
    console.error("[IdeaDetailPage] failed to fetch comment profiles", {
      error: commentProfilesError.message,
      ideaId: id,
    });
  }
  const commentProfileById = new Map(
    ((commentProfiles ?? []) as ProfileLite[]).map((profile) => [profile.id, profile]),
  );
  const commentIds = rawComments
    .map((comment) => comment.id)
    .filter((commentId): commentId is string => typeof commentId === "string" && Boolean(commentId));
  const [{ data: ideaLikes }, { data: commentLikes }, { data: likedComments }] = await Promise.all([
    supabase.from("likes").select("target_id").eq("target_type", "idea").eq("target_id", id),
    commentIds.length
      ? supabase.from("likes").select("target_id").eq("target_type", "comment").in("target_id", commentIds)
      : Promise.resolve({ data: [] }),
    user && commentIds.length
      ? supabase.from("likes").select("target_id").eq("user_id", user.id).eq("target_type", "comment").in("target_id", commentIds)
      : Promise.resolve({ data: [] }),
  ]);
  const commentLikeCounts = new Map<string, number>();
  ((commentLikes ?? []) as { target_id: string }[]).forEach((like) => {
    commentLikeCounts.set(like.target_id, (commentLikeCounts.get(like.target_id) ?? 0) + 1);
  });
  const typedComments = await Promise.all(
    rawComments.map(async (comment) => {
      const imagePath = comment.image_path ?? null;
      let imageUrl: string | null = null;
      if (imagePath) {
        try {
          const { data, error: imageError } = await supabase.storage.from("comment-images").createSignedUrl(imagePath, 60 * 60);
          if (imageError) console.error("[IdeaDetailPage] failed to sign comment image", { error: imageError, imagePath });
          imageUrl = data?.signedUrl ?? null;
        } catch (imageError) {
          console.error("[IdeaDetailPage] failed to sign comment image", { error: imageError, imagePath });
        }
      }
      const embeddedProfile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
      return {
        ...comment,
        image_path: imagePath,
        image_url: imageUrl,
        likes_count: commentLikeCounts.get(comment.id) ?? 0,
        profiles: embeddedProfile ?? commentProfileById.get(comment.user_id) ?? null,
      };
    }),
  );
  console.log("typed comments", typedComments);

  idea.likes_count = ideaLikes?.length ?? 0;
  idea.executions_count = typedExecutions.length;
  const canReportExecution = Boolean(user && !isAuthor && !isArchived && idea.visibility === "public" && !isSelfImprovement && idea.execution_permission === "public");
  const likedCommentIds = ((likedComments ?? []) as { target_id: string }[]).map((like) => like.target_id);
  const imagePaths = [...(Array.isArray(idea.image_urls) ? idea.image_urls : []), ...(idea.image_url ? [idea.image_url] : [])].filter((path): path is string => typeof path === "string" && Boolean(path));
  const imageUrls = (
    await Promise.all(
      [...new Set(imagePaths)].slice(0, 4).map(async (path) => {
        try {
          const { data, error: imageError } = await supabase.storage.from("idea-images").createSignedUrl(path, 60 * 60);
          if (imageError) console.error("[IdeaDetailPage] failed to sign idea image", { error: imageError, path });
          return data?.signedUrl ?? null;
        } catch (imageError) {
          console.error("[IdeaDetailPage] failed to sign idea image", { error: imageError, path });
          return null;
        }
      }),
    )
  ).filter((url): url is string => Boolean(url));

  return (
    <>
      {error && errorMessages[error] ? (
        <div className="container pt-6">
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessages[error]}
          </div>
        </div>
      ) : null}
      <IdeaDetailClient
        canReportExecution={canReportExecution}
        comments={typedComments}
        currentUserId={user?.id}
        currentUserProfile={(currentUserProfile as ProfileLite | null) ?? null}
        executions={typedExecutions}
        idea={idea}
        imageUrls={imageUrls}
        initialLiked={Boolean(liked)}
        initialLikedCommentIds={likedCommentIds}
        isAuthor={isAuthor}
      />
    </>
  );
}
