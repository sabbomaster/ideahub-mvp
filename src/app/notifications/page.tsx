import { Bell, CheckCheck } from "lucide-react";
import { markAllNotificationsRead } from "@/app/actions";
import { NotificationsList } from "@/components/notifications-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
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
        <NotificationsList notifications={notifications} />
      </div>
    </div>
  );
}
