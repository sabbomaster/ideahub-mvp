"use client";

import { useState, useTransition } from "react";
import { loadMorePublicFeedIdeas } from "@/app/actions";
import { IdeaCard, type IdeaCardData } from "@/components/idea-card";
import { Button } from "@/components/ui/button";

const pageSize = 20;

type PublicFeedListProps = {
  currentUserId?: string;
  initialIdeas: IdeaCardData[];
};

export function PublicFeedList({ currentUserId, initialIdeas }: PublicFeedListProps) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [hasMore, setHasMore] = useState(initialIdeas.length === pageSize);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    startTransition(async () => {
      const nextIdeas = await loadMorePublicFeedIdeas(ideas.length);
      setIdeas((currentIdeas) => [...currentIdeas, ...nextIdeas]);
      setHasMore(nextIdeas.length === pageSize);
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4">
        {ideas.length ? ideas.map((idea) => <IdeaCard key={idea.id} currentUserId={currentUserId} idea={idea} />) : <p>まだ公開アイデアがありません。</p>}
      </div>

      {hasMore ? (
        <div className="flex justify-center">
          <Button type="button" variant="outline" onClick={handleLoadMore} disabled={isPending} className="min-h-11 w-full sm:w-auto">
            {isPending ? "読み込み中..." : "もっと見る"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
