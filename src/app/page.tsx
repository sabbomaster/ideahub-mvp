import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Heart, MessageCircle, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IdeaCard } from "@/components/idea-card";
import { getIdeaCards } from "@/lib/queries";
import type { SupabaseLikeClient } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

const featureCards = [
  { title: "反応が見える", body: "いいねやコメントで、役に立ちそうなアイデアが見つかります。", Icon: Heart },
  { title: "改善できる", body: "別視点や具体化のヒントをコメントとして残せます。", Icon: MessageCircle },
  { title: "実行につながる", body: "試した結果を共有し、成功事例として残せます。", Icon: Rocket },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/ideas/new");

  const ideas = await getIdeaCards(supabase as unknown as SupabaseLikeClient, { limit: 3, status: "active", visibility: "public" });

  return (
    <div className="min-w-0">
      <section className="border-b bg-card">
        <div className="container grid gap-8 py-8 sm:py-10 md:grid-cols-[1.15fr_0.85fr] md:items-center md:py-12">
          <div className="min-w-0 space-y-6">
            <div className="inline-flex max-w-full rounded-md bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              思いつきを、実行につながる場所へ
            </div>
            <div className="space-y-4">
              <h1 className="break-words text-4xl font-bold tracking-normal sm:text-5xl">IdeaHub</h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                ラフな案も、本気で練った案も投稿できるアイデアSNSです。公開フィードで他の人の案を見つけ、マイアイデアで自分の投稿や実行済みを整理できます。
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
                <Link href="/login">マイアイデアを管理</Link>
              </Button>
            </div>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-3 md:grid-cols-1">
            {featureCards.map(({ title, body, Icon }) => (
              <Card key={title} className="w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5 shrink-0 text-primary" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">{body}</CardContent>
              </Card>
            ))}
          </div>
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
          {ideas.length ? ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />) : <p>まだ投稿がありません。</p>}
        </div>
      </section>
    </div>
  );
}
