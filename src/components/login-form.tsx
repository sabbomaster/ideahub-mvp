"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ensureProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ message: initialMessage = "" }: { message?: string }) {
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setLoading(false);
      setMessage(result.error.message);
      return;
    }

    if (result.data.user && result.data.session) {
      await ensureProfile(supabase, result.data.user);
    }

    setLoading(false);

    if (mode === "signup" && !result.data.session) {
      setMessage("登録しました。メール確認が必要な場合は、受信箱を確認してください。");
      return;
    }

    window.location.assign("/ideas");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "login" ? "ログイン" : "ユーザー登録"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              メールアドレス
            </label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              パスワード
            </label>
            <Input id="password" name="password" type="password" required minLength={6} autoComplete="current-password" />
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "送信中..." : mode === "login" ? "ログイン" : "登録する"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "新規登録へ" : "ログインへ"}
            </Button>
          </div>
          {mode === "login" ? (
            <div className="border-t pt-4">
              <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:underline">
                パスワードを忘れた方はこちら
              </Link>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
