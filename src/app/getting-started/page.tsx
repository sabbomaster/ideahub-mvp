import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "IdeaHubのはじめかた | IdeaHub",
  description: "IdeaHubで、悩みや課題を整理し、行動と改善を続けるためのはじめかたです。",
  alternates: { canonical: "/getting-started" },
  openGraph: {
    title: "IdeaHubのはじめかた | IdeaHub",
    description: "IdeaHubで、悩みや課題を整理し、行動と改善を続けるためのはじめかたです。",
    url: "/getting-started",
    siteName: "IdeaHub",
    type: "article",
  },
};

const steps = [
  "大きな悩みや課題を小さく切り分けてみる",
  "何をすればいいか考えてみる",
  "実際にやってみる",
  "皆の投稿を読んでみる",
];

export default function GettingStartedPage() {
  return (
    <div className="container max-w-3xl space-y-5 py-8 sm:py-10">
      <Button asChild variant="ghost" className="w-fit px-0 hover:bg-transparent">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          トップへ戻る
        </Link>
      </Button>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Lightbulb className="h-5 w-5" />
            <span className="text-sm font-medium">はじめに</span>
          </div>
          <CardTitle className="text-3xl tracking-normal">IdeaHubのはじめかた</CardTitle>
        </CardHeader>
        <CardContent className="space-y-7 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
          <section className="space-y-4">
            <p>IdeaHubはアイデアだけでなく、自分自身で抱えている悩みや課題を書き出し、行動・改善することで自身の成長を楽しむものとなります。</p>
            <p>どんな悩みも自分で問題を見つけて改善できる自分になれたら…あなたはどう思いますか？</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-normal text-foreground">小さく分けて、動いてみる</h2>
            <ul className="space-y-3">
              {steps.map((step) => (
                <li key={step} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <p>何から始めるかを自分で考えて沢山書き出してみましょう。思いつかないという方はメンタルシーソーに今抱えてる不安を書き出してみる事から始めてみましょう。</p>
            <p>私自身もIdeaHubを使いながら改善と実行を続け、より良いサービスとなるよう楽しんで運営していきます。</p>
            <p>皆さんの実行するボタンを押して「出来た！」をこのサイトで沢山積み重ねてください。IdeaHubが皆さんの成長を支えるものになればとても嬉しいです！</p>
          </section>

          <section className="rounded-md bg-muted p-5">
            <p className="text-lg font-semibold leading-8 text-foreground">このサイトを開いた瞬間にあなたの行動は始まっています。</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
