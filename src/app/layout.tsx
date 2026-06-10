import type { Metadata } from "next";
import Link from "next/link";
import { Lightbulb, LogOut, Plus, Rss, Scale, UserRound } from "lucide-react";
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
          <div className="container flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Lightbulb className="h-5 w-5" />
              </span>
              IdeaHub
            </Link>
            <nav className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/feed">
                  <Rss className="mr-2 h-4 w-4" />
                  公開フィード
                </Link>
              </Button>
              {user ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/ideas">マイアイデア</Link>
                </Button>
              ) : null}
              <Button asChild variant="ghost" size="sm">
                <Link href="/seesaws">
                  <Scale className="mr-2 h-4 w-4" />
                  シーソー
                </Link>
              </Button>
              {user ? (
                <>
                  <Button asChild size="sm">
                    <Link href="/ideas/new">
                      <Plus className="mr-2 h-4 w-4" />
                      投稿
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="icon" title="プロフィール">
                    <Link href={`/profiles/${user.id}`}>
                      <UserRound className="h-4 w-4" />
                    </Link>
                  </Button>
                  <form action={signOut}>
                    <Button variant="ghost" size="icon" title="ログアウト">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </form>
                </>
              ) : (
                <Button asChild size="sm">
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
