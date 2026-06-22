import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList, Lightbulb, PencilLine, Rocket, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { IdeaCard } from "@/components/idea-card";
import { getIdeaCards } from "@/lib/queries";
import type { SupabaseLikeClient } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

const featureCards = [
  {
    title: "思いついたことを書く",
    Icon: PencilLine,
  },
  {
    title: "悩みや課題を整理する",
    Icon: ClipboardList,
  },
  {
    title: "改善案を考える",
    Icon: Lightbulb,
  },
  {
    title: "実行して振り返る",
    Icon: Rocket,
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ideas = await getIdeaCards(supabase as unknown as SupabaseLikeClient, { limit: 3, status: "active", visibility: "public" });

  return (
    <div className="min-w-0">
      <section className="border-b bg-card">
        <div className="container grid gap-8 py-8 sm:py-10 md:grid-cols-[1.15fr_0.85fr] md:items-center md:py-12">
          <div className="min-w-0 space-y-6">
            <div className="inline-flex max-w-full items-center gap-2 rounded-md bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              <Lightbulb className="h-4 w-4 shrink-0" />
              忘れるはずのアイデアが、本物になる。
            </div>
            <div className="space-y-4">
              <h1 className="break-words text-4xl font-bold tracking-normal sm:text-5xl">
                Idea<span className="text-primary">Hub</span>
              </h1>
              <p className="max-w-2xl text-xl font-semibold leading-8 text-foreground sm:text-2xl sm:leading-9">
                アイデアも、悩みも、課題も。頭の中にあるものを整理して、次の一歩へ。
              </p>
            </div>
            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/feed">
                  公開フィードを見る
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href={user ? "/ideas" : "/login"}>マイアイデアを管理</Link>
              </Button>
            </div>
          </div>
          <div className="min-w-0 space-y-3">
            <h2 className="text-xl font-semibold tracking-normal text-foreground">IdeaHubでできること</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              {featureCards.map(({ title, Icon }) => (
                <Card key={title} className="w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-5 w-5 shrink-0 text-primary" />
                      {title}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <div className="container pb-8">
          <div className="flex items-start gap-3 rounded-md bg-muted p-5">
            <Sprout className="mt-1 h-6 w-6 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="text-lg font-semibold leading-8 text-foreground">アイデアを形にする過程が、自分自身の成長にもつながっていく。</p>
            </div>
          </div>
        </div>
        <div className="container pb-8">
          <Link href="/getting-started" className="block">
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 shrink-0 text-primary" />
                  IdeaHubのはじめかた
                  <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                </CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">悩みや課題を小さく分け、次の一歩を見つけるためのヒントを紹介します。</p>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>
      <section className="container space-y-4 py-8 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold tracking-normal">新着アイデア</h2>
          <Button asChild variant="ghost" className="w-full justify-start sm:w-auto sm:justify-center">
            <Link href="/feed">すべて見る</Link>
          </Button>
        </div>
        <div className="grid gap-4">
          {ideas.length ? ideas.map((idea) => <IdeaCard key={idea.id} currentUserId={user?.id} idea={idea} />) : <p>まだ投稿がありません。</p>}
        </div>
      </section>
    </div>
  );
}
