import Link from "next/link";
import { Plus } from "lucide-react";
import { PublicFeedList } from "@/components/public-feed-list";
import { Button } from "@/components/ui/button";
import { getIdeaCards } from "@/lib/queries";
import type { SupabaseLikeClient } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ideas = await getIdeaCards(supabase as unknown as SupabaseLikeClient, {
    range: { from: 0, to: 19 },
    status: "active",
    visibility: "public",
  });

  return (
    <div className="container space-y-6 py-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-3xl font-bold tracking-normal">公開フィード</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">全ユーザーの公開アイデアを見つける場所です。</p>
        </div>
        {user ? (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/ideas/new">
              <Plus className="mr-2 h-4 w-4" />
              投稿する
            </Link>
          </Button>
        ) : null}
      </div>
      <PublicFeedList initialIdeas={ideas} currentUserId={user?.id} />
    </div>
  );
}
