"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/database.types";

type NotificationBellProps = {
  initialUnreadCount?: number;
  userId: string;
};

export function NotificationBell({ initialUnreadCount = 0, userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null)
      .then(({ count, error }) => {
        if (error) {
          console.error("[NotificationBell] failed to fetch unread count", error);
          return;
        }
        setUnreadCount(count ?? 0);
      });

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          setUnreadCount((count) => count + 1);
          setToast(notification.title || "新しい通知があります");

          if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
          toastTimerRef.current = setTimeout(() => {
            setToast(null);
            toastTimerRef.current = null;
          }, 4500);
        },
      )
      .subscribe();

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <div className="relative">
      <Button asChild variant="outline" size="sm" title="Notifications" className="relative justify-center sm:h-9 sm:w-9 sm:px-0">
        <Link href="/notifications" onClick={() => setToast(null)}>
          <Bell className="h-4 w-4" />
          {unreadCount ? (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-destructive px-1 text-center text-[11px] leading-5 text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
          <span className="ml-2 sm:hidden">通知</span>
        </Link>
      </Button>

      {toast ? (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] rounded-md border bg-background px-4 py-3 text-sm shadow-lg sm:max-w-sm">
          <div className="font-medium">新着通知</div>
          <div className="mt-1 text-muted-foreground">{toast}</div>
        </div>
      ) : null}
    </div>
  );
}
