"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Notification } from "@/lib/database.types";

type NotificationsListProps = {
  notifications: Notification[];
};

export function NotificationsList({ notifications }: NotificationsListProps) {
  const router = useRouter();
  const [items, setItems] = useState(notifications);
  const [openingId, setOpeningId] = useState<string | null>(null);

  async function openIdea(notification: Notification) {
    if (!notification.idea_id || openingId) return;
    setOpeningId(notification.id);
    document.body.style.overflow = "";

    const supabase = createClient();
    const readAt = new Date().toISOString();
    const { error } = await supabase.from("notifications").update({ read_at: readAt }).eq("id", notification.id).eq("user_id", notification.user_id);
    if (error) console.error("[NotificationsList] failed to mark notification read", error);
    else setItems((current) => current.map((item) => (item.id === notification.id ? { ...item, read_at: readAt } : item)));

    router.push(`/ideas/${notification.idea_id}`);
  }

  async function markRead(notification: Notification) {
    const readAt = new Date().toISOString();
    const supabase = createClient();
    const { error } = await supabase.from("notifications").update({ read_at: readAt }).eq("id", notification.id).eq("user_id", notification.user_id);
    if (error) {
      console.error("[NotificationsList] failed to mark notification read", error);
      return;
    }
    setItems((current) => current.map((item) => (item.id === notification.id ? { ...item, read_at: readAt } : item)));
  }

  if (!items.length) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">まだ通知はありません。</CardContent>
      </Card>
    );
  }

  return (
    <>
      {items.map((notification) => (
        <Card key={notification.id} className={!notification.read_at ? "border-primary/50 bg-primary/5" : undefined}>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              {!notification.read_at ? <Badge>未読</Badge> : <Badge variant="outline">既読</Badge>}
              <Badge variant="outline">{notification.type === "execution" ? "実行報告" : "コメント"}</Badge>
              <span className="text-xs text-muted-foreground">{formatDate(notification.created_at)}</span>
            </div>

            <button
              type="button"
              className="block w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => openIdea(notification)}
              disabled={Boolean(openingId)}
            >
              <div className="font-semibold text-foreground">{notification.title}</div>
              {notification.body ? <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">{notification.body}</p> : null}
              <p className="mt-2 text-xs text-primary">{openingId === notification.id ? "開いています..." : "対象のアイデアを開く"}</p>
            </button>

            {!notification.read_at ? (
              <Button type="button" variant="ghost" size="sm" className="w-full justify-start sm:w-auto" onClick={() => markRead(notification)}>
                既読にする
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
