import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "利用規約 | IdeaHub",
  description: "IdeaHubの利用規約です。",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "利用規約 | IdeaHub",
    description: "IdeaHubの利用規約です。",
    url: "/terms",
    siteName: "IdeaHub",
    type: "article",
  },
};

const sections = [
  {
    title: "IdeaHubの概要",
    body: [
      "IdeaHubは、アイデア、改善案、実行記録などを投稿・管理できる個人開発のMVPサービスです。",
      "ユーザーは、自分のアイデアを整理したり、公開フィードで他のユーザーからコメントや実行報告を受け取ったりできます。",
    ],
  },
  {
    title: "禁止事項",
    body: [
      "法令に違反する行為、誹謗中傷、なりすまし、スパム、他者の権利侵害、サービス妨害、不正アクセスを禁止します。",
      "また、過度な連続投稿、虚偽情報の投稿、他のユーザーが安心して利用できなくなる行為も控えてください。",
    ],
  },
  {
    title: "投稿責任",
    body: [
      "投稿内容の責任は投稿者本人が負います。",
      "不適切な投稿、権利侵害のおそれがある投稿、サービス運営上問題がある投稿は、削除・非表示・アカウント制限の対象となる場合があります。",
    ],
  },
  {
    title: "免責事項",
    body: [
      "IdeaHubは、投稿内容の正確性、有用性、実現可能性を保証しません。",
      "サービス利用によって発生した損害について、運営者は法令上認められる範囲で責任を負わないものとします。",
    ],
  },
  {
    title: "サービス変更・停止",
    body: [
      "IdeaHubは個人開発MVPとして運営しているため、予告なく機能の変更、停止、終了を行う場合があります。",
      "大きな変更がある場合は、可能な範囲でサービス内や関連ページで案内します。",
    ],
  },
  {
    title: "アカウント停止・投稿削除",
    body: [
      "規約違反や不正利用が確認された場合、アカウントの利用制限や投稿削除を行う場合があります。",
      "低信用ポイントのユーザーを直ちに悪質と判断するものではありませんが、荒らし対策や安全性のため段階的な制限を行うことがあります。",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-8 sm:py-10">
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl tracking-normal">利用規約</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">IdeaHubを安心して使うためのルールです。最終更新日: 2026年6月12日</p>
        </CardHeader>
        <CardContent className="space-y-7 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold tracking-normal text-foreground">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-normal text-foreground">お問い合わせ先</h2>
            <p>
              利用規約に関するお問い合わせは{" "}
              <Link href="mailto:anyon8571@gmail.com" className="font-medium text-primary underline-offset-4 hover:underline">
                anyon8571@gmail.com
              </Link>
              までご連絡ください。
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
