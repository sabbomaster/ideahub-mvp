"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

const feedbackTypes = [
  { label: "バグ報告", value: "bug" },
  { label: "質問", value: "question" },
  { label: "改善要望", value: "improvement" },
  { label: "その他", value: "other" },
] as const;

export function FeedbackReportForm() {
  const supabase = createClient();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const type = String(form.get("type") ?? "bug");
    const content = String(form.get("content") ?? "").trim();
    const pageUrl = String(form.get("page_url") ?? "").trim();
    const contact = String(form.get("contact") ?? "").trim();

    if (!content) {
      setLoading(false);
      setMessage("内容を入力してください。");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("feedback_reports").insert({
      user_id: user?.id ?? null,
      type,
      content,
      page_url: pageUrl || null,
      contact: contact || null,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      setMessage("送信に失敗しました。時間を置いてもう一度お試しください。");
      return;
    }

    event.currentTarget.reset();
    setMessage("送信しました。ありがとうございます。");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium">
          種別
        </label>
        <select
          id="type"
          name="type"
          className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue="bug"
        >
          {feedbackTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium">
          内容
        </label>
        <Textarea id="content" name="content" required className="min-h-40" placeholder="気づいたこと、困ったこと、質問などを書いてください。" />
      </div>
      <div className="space-y-2">
        <label htmlFor="page_url" className="text-sm font-medium">
          発生ページURL 任意
        </label>
        <Input id="page_url" name="page_url" type="url" placeholder="https://..." />
      </div>
      <div className="space-y-2">
        <label htmlFor="contact" className="text-sm font-medium">
          連絡先 任意
        </label>
        <Input id="contact" name="contact" placeholder="返信が必要な場合のメールアドレスなど" />
      </div>
      {message ? <p className="text-sm leading-6 text-muted-foreground">{message}</p> : null}
      <Button type="submit" disabled={loading} className="min-h-11 w-full sm:w-auto">
        {loading ? "送信中..." : "送信する"}
      </Button>
    </form>
  );
}
