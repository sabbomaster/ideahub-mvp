import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IdeaCard } from "@/components/idea-card";
import { getIdeaCards } from "@/lib/queries";
import type { SupabaseLikeClient } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ideas = await getIdeaCards(supabase as unknown as SupabaseLikeClient, { status: "active", visibility: "public" });

  return (
    <div className="container space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">公開フィード</h1>
          <p className="mt-2 text-muted-foreground">全ユーザーの公開アイデアを見つける場所です。</p>
        </div>
        {user ? (
          <Button asChild>
            <Link href="/ideas/new">
              <Plus className="mr-2 h-4 w-4" />
              投稿する
            </Link>
          </Button>
        ) : null}
      </div>
      <div className="grid gap-4">
        {ideas.length ? ideas.map((idea) => <IdeaCard key={idea.id} currentUserId={user?.id} idea={idea} />) : <p>まだ公開アイデアがありません。</p>}
      </div>
    </div>
  );
}
