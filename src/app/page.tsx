import Link from "next/link";
import { ArrowRight, Heart, MessageCircle, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IdeaCard } from "@/components/idea-card";
import { getIdeaCards } from "@/lib/queries";
import type { SupabaseLikeClient } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

const featureCards = [
  { title: "反応", body: "いいねで、役に立ちそうなアイデアが見つかります。", Icon: Heart },
  { title: "改善提案", body: "コメントで別視点や具体化のヒントを残せます。", Icon: MessageCircle },
  { title: "実行報告", body: "試した結果を共有し、成功事例として残せます。", Icon: Rocket },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ideas = await getIdeaCards(supabase as unknown as SupabaseLikeClient, { limit: 3, status: "active", visibility: "public" });

  return (
    <div>
      <section className="border-b bg-card">
        <div className="container grid gap-8 py-12 md:grid-cols-[1.15fr_0.85fr] md:items-center">
          <div className="space-y-6">
            <div className="inline-flex rounded-md bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              思いつきを、実行につながる場所へ。
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-normal md:text-5xl">IdeaHub</h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                ラフな案も、本気で練った案も投稿できるアイデアSNSです。公開フィードで他の人の案を見つけ、マイアイデアで自分の投稿や実行済みを管理できます。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/feed">
                  公開フィードを見る
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={user ? "/ideas" : "/login"}>マイアイデアを管理</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            {featureCards.map(({ title, body, Icon }) => (
              <Card key={title}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5 text-primary" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="container space-y-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-normal">新着アイデア</h2>
          <Button asChild variant="ghost">
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
