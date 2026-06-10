import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, Lightbulb, LogOut, Plus, Rss, Scale, UserRound } from "lucide-react";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "IdeaHub MVP",
  description: "アイデア投稿SNSのMVP",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="ja">
      <body>
        <header className="border-b bg-card/90 backdrop-blur">
          <div className="container flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-0">
            <Link href="/" className="flex min-h-10 items-center gap-2 font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Lightbulb className="h-5 w-5" />
              </span>
              IdeaHub
            </Link>
            <nav className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end">
              <Button asChild variant="ghost" size="sm" className="justify-start sm:justify-center">
                <Link href="/feed">
                  <Rss className="mr-2 h-4 w-4" />
                  公開フィード
                </Link>
              </Button>
              {user ? (
                <Button asChild variant="ghost" size="sm" className="justify-start sm:justify-center">
                  <Link href="/ideas">マイアイデア</Link>
                </Button>
              ) : null}
              <Button asChild variant="ghost" size="sm" className="justify-start sm:justify-center">
                <Link href="/seesaws">
                  <Scale className="mr-2 h-4 w-4" />
                  シーソー
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="justify-start sm:justify-center">
                <Link href="/feedback">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  質問・不具合報告
                </Link>
              </Button>
              {user ? (
                <>
                  <Button asChild size="sm" className="justify-start sm:justify-center">
                    <Link href="/ideas/new">
                      <Plus className="mr-2 h-4 w-4" />
                      投稿
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" title="プロフィール" className="justify-center sm:h-9 sm:w-9 sm:px-0">
                    <Link href={`/profiles/${user.id}`}>
                      <UserRound className="h-4 w-4" />
                      <span className="ml-2 sm:hidden">プロフィール</span>
                    </Link>
                  </Button>
                  <form action={signOut}>
                    <Button variant="ghost" size="sm" title="ログアウト" className="w-full justify-center sm:h-9 sm:w-9 sm:px-0">
                      <LogOut className="h-4 w-4" />
                      <span className="ml-2 sm:hidden">ログアウト</span>
                    </Button>
                  </form>
                </>
              ) : (
                <Button asChild size="sm" className="justify-start sm:justify-center">
                  <Link href="/login">ログイン</Link>
                </Button>
              )}
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
