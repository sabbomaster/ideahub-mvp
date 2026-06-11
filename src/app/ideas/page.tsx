import { redirect } from "next/navigation";
import Link from "next/link";
import { Archive, CheckCircle2, Lightbulb, Plus, Rss } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IdeaCard, type IdeaCardData } from "@/components/idea-card";
import { getIdeaCards, getMyExecutedIdeaCards } from "@/lib/queries";
import type { SupabaseLikeClient } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type MyIdeaBox = "active" | "completed" | "archived";
type MyIdeaSort = "completed_first" | "created_asc" | "created_desc" | "title_asc" | "updated_desc";

const tabs: Array<{ href: string; icon: typeof Lightbulb; key: MyIdeaBox; label: string }> = [
  { href: "/ideas", icon: Lightbulb, key: "active", label: "マイアイデア" },
  { href: "/ideas?box=completed", icon: CheckCircle2, key: "completed", label: "実行済み" },
  { href: "/ideas?box=archived", icon: Archive, key: "archived", label: "アーカイブ" },
];

const sortOptions: Array<{ key: MyIdeaSort; label: string }> = [
  { key: "updated_desc", label: "最終更新順" },
  { key: "created_desc", label: "投稿日時順 新しい順" },
  { key: "created_asc", label: "投稿日時順 古い順" },
  { key: "title_asc", label: "タイトル順" },
  { key: "completed_first", label: "実行済み優先" },
];

function normalizeBox(box?: string): MyIdeaBox {
  return box === "completed" ? "completed" : box === "archived" ? "archived" : "active";
}

function normalizeSort(sort?: string): MyIdeaSort {
  return sortOptions.some((option) => option.key === sort) ? (sort as MyIdeaSort) : "updated_desc";
}

function sortIdeas(ideas: IdeaCardData[], sort: MyIdeaSort) {
  return [...ideas].sort((a, b) => {
    if (sort === "created_asc") return Date.parse(a.created_at) - Date.parse(b.created_at);
    if (sort === "created_desc") return Date.parse(b.created_at) - Date.parse(a.created_at);
    if (sort === "title_asc") return a.title.localeCompare(b.title, "ja");
    if (sort === "completed_first") {
      const completedDiff = Number(b.status === "completed") - Number(a.status === "completed");
      if (completedDiff !== 0) return completedDiff;
      return Date.parse(b.updated_at) - Date.parse(a.updated_at);
    }

    return Date.parse(b.updated_at) - Date.parse(a.updated_at);
  });
}

function buildIdeasHref(box: MyIdeaBox, sort: MyIdeaSort) {
  const params = new URLSearchParams();
  if (box !== "active") params.set("box", box);
  if (sort !== "updated_desc") params.set("sort", sort);
  const query = params.toString();
  return query ? `/ideas?${query}` : "/ideas";
}

export default async function IdeasPage({ searchParams }: { searchParams: Promise<{ box?: string; sort?: string }> }) {
  const { box, sort } = await searchParams;
  const currentBox = normalizeBox(box);
  const currentSort = normalizeSort(sort);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const ideaClient = supabase as unknown as SupabaseLikeClient;
  const [activeIdeas, completedIdeas, archivedIdeas] = await Promise.all([
    getIdeaCards(ideaClient, { limit: 100, orderBy: "updated_at", status: "active", userId: user.id }),
    getMyExecutedIdeaCards(ideaClient, user.id, 100),
    getIdeaCards(ideaClient, { limit: 100, orderBy: "updated_at", status: "archived", userId: user.id }),
  ]);
  const ideasByBox: Record<MyIdeaBox, IdeaCardData[]> = {
    active: activeIdeas,
    completed: completedIdeas,
    archived: archivedIdeas,
  };
  const counts: Record<MyIdeaBox, number> = {
    active: activeIdeas.length,
    completed: completedIdeas.length,
    archived: archivedIdeas.length,
  };
  const ideas = sortIdeas(ideasByBox[currentBox], currentSort);

  return (
    <div className="container space-y-6 py-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-3xl font-bold tracking-normal">マイアイデア管理</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            自分が投稿したアイデア、実行済み、アーカイブを管理できます。
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
              <Link href={buildIdeasHref(tab.key, currentSort)}>
                <Icon className="h-4 w-4" />
                {tab.label} {counts[tab.key]}
              </Link>
            </Button>
          );
        })}
      </div>

      <section className="space-y-3">
        <div className="text-sm font-medium">並び替え</div>
        <div className="grid grid-cols-1 gap-2 rounded-md border bg-card p-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
          {sortOptions.map((option) => {
            const isActive = currentSort === option.key;
            return (
              <Button
                key={option.key}
                asChild
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn("w-full justify-start lg:w-auto lg:justify-center", isActive ? "" : "text-muted-foreground")}
              >
                <Link href={buildIdeasHref(currentBox, option.key)}>{option.label}</Link>
              </Button>
            );
          })}
        </div>
      </section>

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
