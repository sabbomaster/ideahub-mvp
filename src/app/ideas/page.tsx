import { redirect } from "next/navigation";
import Link from "next/link";
import { Archive, CheckCircle2, Lightbulb, Plus, Rss } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IdeaCard } from "@/components/idea-card";
import { getIdeaCards, getMyExecutedIdeaCards } from "@/lib/queries";
import type { SupabaseLikeClient } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type MyIdeaBox = "active" | "completed" | "archived";

const tabs: Array<{ href: string; icon: typeof Lightbulb; key: MyIdeaBox; label: string }> = [
  { href: "/ideas", icon: Lightbulb, key: "active", label: "マイアイデア" },
  { href: "/ideas?box=completed", icon: CheckCircle2, key: "completed", label: "実行済み" },
  { href: "/ideas?box=archived", icon: Archive, key: "archived", label: "アーカイブ" },
];

export default async function IdeasPage({ searchParams }: { searchParams: Promise<{ box?: string }> }) {
  const { box } = await searchParams;
  const currentBox: MyIdeaBox = box === "completed" ? "completed" : box === "archived" ? "archived" : "active";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const ideaClient = supabase as unknown as SupabaseLikeClient;
  const [activeIdeas, completedIdeas, archivedIdeas] = await Promise.all([
    getIdeaCards(ideaClient, { status: "active", userId: user.id }),
    getMyExecutedIdeaCards(ideaClient, user.id),
    getIdeaCards(ideaClient, { status: "archived", userId: user.id }),
  ]);
  const ideasByBox: Record<MyIdeaBox, typeof activeIdeas> = {
    active: activeIdeas,
    completed: completedIdeas,
    archived: archivedIdeas,
  };
  const counts: Record<MyIdeaBox, number> = {
    active: activeIdeas.length,
    completed: completedIdeas.length,
    archived: archivedIdeas.length,
  };
  const ideas = ideasByBox[currentBox];

  return (
    <div className="container space-y-6 py-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-3xl font-bold tracking-normal">マイアイデア管理</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            自分が投稿したアイデア、実行済み、アーカイブを管理します。
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/feed">
              <Rss className="mr-2 h-4 w-4" />
              公開フィード
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/ideas/new">
              <Plus className="mr-2 h-4 w-4" />
              投稿する
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 rounded-md border bg-card p-2 sm:grid-cols-3 md:flex md:flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentBox === tab.key;
          return (
            <Button
              key={tab.key}
              asChild
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={cn("w-full justify-start gap-2 md:w-auto md:justify-center", isActive ? "" : "text-muted-foreground")}
            >
              <Link href={tab.href}>
                <Icon className="h-4 w-4" />
                {tab.label} {counts[tab.key]}
              </Link>
            </Button>
          );
        })}
      </div>
      <div className="grid gap-4">
        {ideas.length ? (
          ideas.map((idea) => <IdeaCard key={idea.id} currentUserId={user.id} idea={idea} showExecutionReportAction={false} />)
        ) : (
          <p>このボックスにはまだアイデアがありません。</p>
        )}
      </div>
    </div>
  );
}
