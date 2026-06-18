import Link from "next/link";
import { ArrowRight, Heart, Lightbulb, MessageCircle, Rocket, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IdeaCard } from "@/components/idea-card";
import { getIdeaCards } from "@/lib/queries";
import type { SupabaseLikeClient } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

const featureCards = [
  {
    title: "反応が見える",
    body: "いいねやコメントは「見たよ」のサイン。誰かの存在が、次の一歩をそっと後押しします。",
    Icon: Heart,
  },
  {
    title: "改善できる",
    body: "別視点や具体的なヒントを受け取り、頭の中のアイデアを少しずつ育てられます。",
    Icon: MessageCircle,
  },
  {
    title: "実行につながる",
    body: "記録だけで終わらせず、小さな行動や試した結果を積み重ねていけます。",
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
                アイデアを記録し、実行し、アウトプットの習慣をつくる場所。
              </p>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                思いつき、気づき、不満、課題、やりたいこと。頭の中にあるものを外に出して、誰かの目とつながりながら、少しずつ形にしていく半SNSです。
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
            <div className="flex max-w-2xl items-start gap-3 rounded-md bg-muted p-4 text-sm leading-6 text-muted-foreground">
              <Heart className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p>
                <span className="font-medium text-foreground">いいねは「見たよ」「気になったよ」「応援してるよ」のサイン。</span>
                人の目が、あなたの一歩を後押しします。
              </p>
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
        <div className="container pb-8">
          <div className="flex items-start gap-3 rounded-md bg-muted p-5">
            <Sprout className="mt-1 h-6 w-6 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="text-lg font-semibold text-foreground">思いつきを、形に。行動を、習慣に。</p>
              <p className="text-sm leading-6 text-muted-foreground">
                IdeaHubは、頭の中にあるものを外に出し、誰かの目とつながり、実行まで近づける場所です。
              </p>
            </div>
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
          {ideas.length ? ideas.map((idea) => <IdeaCard key={idea.id} currentUserId={user?.id} idea={idea} />) : <p>まだ投稿がありません。</p>}
        </div>
      </section>
    </div>
  );
}
