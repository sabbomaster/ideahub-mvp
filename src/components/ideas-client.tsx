"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Archive, CheckCircle2, Lightbulb, Rss } from "lucide-react";
import { IdeaCard, type IdeaCardData } from "@/components/idea-card";
import { NewIdeaForm } from "@/components/new-idea-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MyIdeaBox = "active" | "completed" | "archived";
type MyIdeaSort = "completed_first" | "created_asc" | "created_desc" | "title_asc" | "updated_desc";
type ProfileLite = { id: string; username: string | null; display_name: string | null };

const tabs: Array<{ icon: typeof Lightbulb; key: MyIdeaBox; label: string }> = [
  { icon: Lightbulb, key: "active", label: "マイアイデア" },
  { icon: CheckCircle2, key: "completed", label: "実行済み" },
  { icon: Archive, key: "archived", label: "アーカイブ" },
];

const sortOptions: Array<{ key: MyIdeaSort; label: string }> = [
  { key: "updated_desc", label: "最終更新順" },
  { key: "created_desc", label: "投稿日時順 新しい順" },
  { key: "created_asc", label: "投稿日時順 古い順" },
  { key: "title_asc", label: "タイトル順" },
  { key: "completed_first", label: "実行済み優先" },
];

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

type IdeasClientProps = {
  canUseSerious: boolean;
  currentBox: MyIdeaBox;
  currentSort: MyIdeaSort;
  currentUserId: string;
  currentUserProfile: ProfileLite | null;
  initialIdeasByBox: Record<MyIdeaBox, IdeaCardData[]>;
};

export function IdeasClient({ canUseSerious, currentBox: initialBox, currentSort: initialSort, currentUserId, currentUserProfile, initialIdeasByBox }: IdeasClientProps) {
  const [currentBox, setCurrentBox] = useState(initialBox);
  const [currentSort, setCurrentSort] = useState(initialSort);
  const [ideasByBox, setIdeasByBox] = useState(initialIdeasByBox);

  const counts: Record<MyIdeaBox, number> = {
    active: ideasByBox.active.length,
    completed: ideasByBox.completed.length,
    archived: ideasByBox.archived.length,
  };
  const ideas = useMemo(() => sortIdeas(ideasByBox[currentBox], currentSort), [currentBox, currentSort, ideasByBox]);

  function handleOptimisticIdea(idea: IdeaCardData) {
    setIdeasByBox((current) => ({
      ...current,
      active: [idea, ...current.active],
    }));
    setCurrentBox("active");
    setCurrentSort("updated_desc");
  }

  function handleIdeaSaved(temporaryId: string, savedIdea: IdeaCardData) {
    setIdeasByBox((current) => ({
      ...current,
      active: current.active.map((idea) => (idea.id === temporaryId ? savedIdea : idea)),
    }));
  }

  function handleIdeaFailed(temporaryId: string) {
    setIdeasByBox((current) => ({
      ...current,
      active: current.active.filter((idea) => idea.id !== temporaryId),
    }));
  }

  return (
    <div className="container space-y-6 py-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-3xl font-bold tracking-normal">マイアイデア管理</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            自分が投稿したアイデア、実行済み、アーカイブを管理できます。
          </p>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/feed">
            <Rss className="mr-2 h-4 w-4" />
            公開フィード
          </Link>
        </Button>
      </div>

      <section className="rounded-md border bg-card p-4">
        <h2 className="mb-4 text-lg font-semibold">アイデアを投稿</h2>
        <NewIdeaForm
          canUseSerious={canUseSerious}
          currentUserId={currentUserId}
          currentUserProfile={currentUserProfile}
          onIdeaFailed={handleIdeaFailed}
          onIdeaSaved={handleIdeaSaved}
          onOptimisticIdea={handleOptimisticIdea}
        />
      </section>

      <div className="grid grid-cols-1 gap-2 rounded-md border bg-card p-2 sm:grid-cols-3 md:flex md:flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentBox === tab.key;
          return (
            <Button
              key={tab.key}
              type="button"
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={cn("w-full justify-start gap-2 md:w-auto md:justify-center", isActive ? "" : "text-muted-foreground")}
              onClick={() => setCurrentBox(tab.key)}
            >
              <Icon className="h-4 w-4" />
              {tab.label} {counts[tab.key]}
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
                type="button"
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn("w-full justify-start lg:w-auto lg:justify-center", isActive ? "" : "text-muted-foreground")}
                onClick={() => setCurrentSort(option.key)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4">
        {ideas.length ? (
          ideas.map((idea) => <IdeaCard key={idea.id} currentUserId={currentUserId} idea={idea} showExecutionReportAction={false} />)
        ) : (
          <p>このボックスにはまだアイデアがありません。</p>
        )}
      </div>
    </div>
  );
}
