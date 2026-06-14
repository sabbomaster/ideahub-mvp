import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "プライバシーポリシー | IdeaHub",
  description: "IdeaHubのプライバシーポリシーです。",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "プライバシーポリシー | IdeaHub",
    description: "IdeaHubのプライバシーポリシーです。",
    url: "/privacy",
    siteName: "IdeaHub",
    type: "article",
  },
};

const sections = [
  {
    title: "収集する情報",
    body: [
      "IdeaHubでは、Googleログイン時に取得されるメールアドレス、表示名、プロフィール画像を、ログイン認証とユーザー識別のために利用します。",
      "また、ユーザーが投稿したアイデア、コメント、実行記録、プロフィール情報をサービス提供のために保存します。",
      "サービス改善や不正利用防止のため、アクセス日時、利用ページ、端末やブラウザに関する情報などを確認する場合があります。",
    ],
  },
  {
    title: "Googleアカウント情報の利用目的",
    body: [
      "Googleアカウント情報は、ログイン認証、ユーザー識別、プロフィール表示、通知、投稿者表示のために利用します。",
      "取得したGoogleアカウント情報を、これらの目的以外で不必要に利用することはありません。",
    ],
  },
  {
    title: "Cookieや類似技術の利用",
    body: [
      "IdeaHubでは、ログイン状態の維持、セキュリティ、利便性向上のためにCookieや類似技術を利用します。",
      "これらは、認証セッションの維持や不正アクセス対策など、サービスを安全に利用するために必要な範囲で使われます。",
    ],
  },
  {
    title: "第三者提供について",
    body: [
      "法令に基づく場合を除き、本人の同意なく個人情報を第三者へ提供しません。",
      "ただし、サービス運営に必要な範囲で、下記の外部サービスを利用します。",
    ],
  },
  {
    title: "外部サービス",
    body: [
      "IdeaHubでは、認証とデータ保存にSupabase、ホスティングにVercel、ログイン認証にGoogle OAuthを利用しています。",
      "これらの外部サービスでは、それぞれのプライバシーポリシーや利用規約に従って情報が扱われます。",
    ],
  },
  {
    title: "データ削除・問い合わせ",
    body: [
      "ユーザーからの問い合わせに応じて、可能な範囲でアカウント情報や投稿データの削除に対応します。",
      "削除対応では、本人確認や対象データの確認のために追加情報をお願いする場合があります。",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-8 sm:py-10">
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl tracking-normal">プライバシーポリシー</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">IdeaHubで扱う情報と、その利用目的について説明します。最終更新日: 2026年6月12日</p>
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
              プライバシーに関するお問い合わせは{" "}
              <Link href="mailto:ideahub.contact.jp@gmail.com" className="font-medium text-primary underline-offset-4 hover:underline">
                ideahub.contact.jp@gmail.com
              </Link>
              までご連絡ください。
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
