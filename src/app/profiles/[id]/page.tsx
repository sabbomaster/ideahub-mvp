/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { updateProfile } from "@/app/actions";
import { CreditActivityChart } from "@/components/credit-activity-chart";
import { IdeaCard } from "@/components/idea-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getIdeaCards } from "@/lib/queries";
import type { SupabaseLikeClient } from "@/lib/queries";
import type { Profile } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

const errorMessages: Record<string, string> = {
  avatar: "プロフィール画像のアップロードに失敗しました。2MB以下の画像を選んでください。",
  profile: "プロフィールの保存に失敗しました。",
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ chart?: string; error?: string }>;
}) {
  const { id } = await params;
  const { chart, error } = await searchParams;
  const chartMode = chart === "radar" ? "radar" : "bar";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isMe = user?.id === id;
  const ideaClient = supabase as unknown as SupabaseLikeClient;
  const [{ data: profile }, ideas, ideaCount, executionCount, improvementCount] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    getIdeaCards(ideaClient, { includeNonPublic: isMe, userId: id }),
    supabase.from("ideas").select("id", { count: "exact", head: true }).eq("user_id", id),
    supabase.from("executions").select("id", { count: "exact", head: true }).eq("user_id", id),
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", id),
  ]);

  const stats = {
    ideas: ideaCount.count ?? 0,
    executions: executionCount.count ?? 0,
    improvements: improvementCount.count ?? 0,
  };
  const typedProfile = profile as Profile | null;
  const profileName = typedProfile?.display_name || typedProfile?.username || "匿名ユーザー";

  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {typedProfile?.avatar_url ? (
                <img src={typedProfile.avatar_url} alt="" className="h-20 w-20 shrink-0 rounded-full border object-cover" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border bg-muted text-2xl font-semibold">
                  {getInitial(profileName)}
                </div>
              )}
              <CardTitle className="leading-snug">{profileName}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <CreditActivityChart mode={chartMode} stats={stats} />
            {typedProfile?.bio ? <p className="whitespace-pre-wrap border-t pt-4 text-sm leading-6 text-muted-foreground">{typedProfile.bio}</p> : null}
          </CardContent>
        </Card>

        {isMe ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">プロフィール編集</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateProfile} className="space-y-3">
                {error && errorMessages[error] ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {errorMessages[error]}
                  </div>
                ) : null}
                <div className="space-y-2">
                  <label htmlFor="avatar" className="text-sm font-medium">
                    プロフィール画像
                  </label>
                  <Input id="avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
                  <p className="text-xs text-muted-foreground">PNG / JPEG / WebP / GIF、2MBまで。</p>
                </div>
                <Input name="username" placeholder="ユーザー名" defaultValue={typedProfile?.username ?? ""} />
                <Input name="display_name" placeholder="表示名" defaultValue={typedProfile?.display_name ?? ""} />
                <Textarea name="bio" placeholder="自己紹介" defaultValue={typedProfile?.bio ?? ""} />
                <Button type="submit">保存</Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </aside>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-normal">投稿したアイデア</h1>
          {isMe ? (
            <Button asChild>
              <Link href="/ideas/new">投稿する</Link>
            </Button>
          ) : null}
        </div>
        <div className="grid gap-4">
          {ideas.length ? (
            ideas.map((idea) => <IdeaCard key={idea.id} currentUserId={user?.id} idea={idea} />)
          ) : (
            <p>投稿はまだありません。</p>
          )}
        </div>
      </section>
    </div>
  );
}
