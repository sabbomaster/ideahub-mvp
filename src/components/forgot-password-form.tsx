"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const supabase = createClient();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const redirectTo = `${window.location.origin}/auth/callback?next=/auth/update-password`;

    if (email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) console.error(error);
    }

    setLoading(false);
    setMessage("再設定メールを送信しました。メールが届かない場合は、入力内容や迷惑メールフォルダを確認してください。");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          メールアドレス
        </label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      {message ? <p className="text-sm leading-6 text-muted-foreground">{message}</p> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "送信中..." : "再設定メールを送る"}
      </Button>
    </form>
  );
}
