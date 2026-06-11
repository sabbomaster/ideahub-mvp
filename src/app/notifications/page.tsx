import { Bell, CheckCheck } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead, openNotification } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Notification } from "@/lib/database.types";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              通知
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">通知を見るにはログインしてください。</p>
            <Button asChild>
              <a href="/login">ログインする</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id,user_id,actor_id,idea_id,type,title,body,read_at,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) console.error(error);

  const notifications = (data ?? []) as Notification[];
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  return (
    <div className="container max-w-3xl space-y-6 py-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-normal">
            <Bell className="h-7 w-7 text-primary" />
            通知
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">コメント・改善提案・実行報告をここで確認できます。</p>
        </div>
        {unreadCount ? (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="outline" className="w-full sm:w-auto">
              <CheckCheck className="mr-2 h-4 w-4" />
              すべて既読
            </Button>
          </form>
        ) : null}
      </div>

      <div className="grid gap-3">
        {notifications.length ? (
          notifications.map((notification) => (
            <Card key={notification.id} className={!notification.read_at ? "border-primary/50 bg-primary/5" : undefined}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {!notification.read_at ? <Badge>未読</Badge> : <Badge variant="outline">既読</Badge>}
                  <Badge variant="outline">{notification.type === "execution" ? "実行報告" : "コメント"}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(notification.created_at)}</span>
                </div>

                <form action={openNotification.bind(null, notification.id)}>
                  <button type="submit" className="block w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <div className="font-semibold text-foreground">{notification.title}</div>
                    {notification.body ? <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">{notification.body}</p> : null}
                    <p className="mt-2 text-xs text-primary">対象のアイデアを開く</p>
                  </button>
                </form>

                {!notification.read_at ? (
                  <form action={markNotificationRead.bind(null, notification.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="w-full justify-start sm:w-auto">
                      既読にする
                    </Button>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">まだ通知はありません。</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
