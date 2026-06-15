import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, Lightbulb, LogOut, Plus, Rss, Scale, UserRound } from "lucide-react";
import { signOut } from "@/app/actions";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "IdeaHub",
  description: "アイデアを記録して実行につなげるサービス",
  verification: {
    google: "aQGeKHrROuehnm1FtYhBG2a6z0KF9QHhy9RBZrMDy0g",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "IdeaHub",
    description: "アイデアを記録して実行につなげるサービス",
    url: "/",
    siteName: "IdeaHub",
    type: "website",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { count: unreadNotificationCount } = user
    ? await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null)
    : { count: 0 };

  return (
    <html lang="ja">
      <body className="flex min-h-screen flex-col">
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
                  {"\u516c\u958b\u30d5\u30a3\u30fc\u30c9"}
                </Link>
              </Button>
              {user ? (
                <Button asChild variant="ghost" size="sm" className="justify-start sm:justify-center">
                  <Link href="/ideas">{"\u30de\u30a4\u30a2\u30a4\u30c7\u30a2"}</Link>
                </Button>
              ) : null}
              <Button asChild variant="ghost" size="sm" className="justify-start sm:justify-center">
                <Link href="/seesaws">
                  <Scale className="mr-2 h-4 w-4" />
                  {"\u30b7\u30fc\u30bd\u30fc"}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="justify-start sm:justify-center">
                <Link href="/feedback">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  {"\u8cea\u554f\u30fb\u5831\u544a"}
                </Link>
              </Button>
              {user ? (
                <>
                  <Button asChild size="sm" className="justify-start sm:justify-center">
                    <Link href="/ideas/new">
                      <Plus className="mr-2 h-4 w-4" />
                      {"\u6295\u7a3f"}
                    </Link>
                  </Button>
                  <NotificationBell initialUnreadCount={unreadNotificationCount ?? 0} userId={user.id} />
                  <Button asChild variant="outline" size="sm" title="Profile" className="justify-center sm:h-9 sm:w-9 sm:px-0">
                    <Link href={`/profiles/${user.id}`}>
                      <UserRound className="h-4 w-4" />
                      <span className="ml-2 sm:hidden">{"\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb"}</span>
                    </Link>
                  </Button>
                  <form action={signOut}>
                    <Button variant="ghost" size="sm" title="Logout" className="w-full justify-center sm:h-9 sm:w-9 sm:px-0">
                      <LogOut className="h-4 w-4" />
                      <span className="ml-2 sm:hidden">{"\u30ed\u30b0\u30a2\u30a6\u30c8"}</span>
                    </Button>
                  </form>
                </>
              ) : (
                <Button asChild size="sm" className="justify-start sm:justify-center">
                  <Link href="/login">{"\u30ed\u30b0\u30a4\u30f3"}</Link>
                </Button>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t bg-card/70">
          <div className="container flex flex-col gap-2 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>IdeaHub</div>
            <nav className="flex flex-wrap gap-x-4 gap-y-2">
              <Link href="/privacy" className="hover:text-foreground">
                プライバシーポリシー
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                利用規約
              </Link>
              <Link href="/feedback" className="hover:text-foreground">
                お問い合わせ
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
