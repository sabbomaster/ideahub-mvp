"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

const feedbackTypes = [
  { label: "\u30d0\u30b0\u5831\u544a", value: "bug" },
  { label: "\u8cea\u554f", value: "question" },
  { label: "\u6539\u5584\u8981\u671b", value: "improvement" },
  { label: "\u305d\u306e\u4ed6", value: "other" },
] as const;

export function FeedbackReportForm() {
  const supabase = createClient();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setLoading(true);
    setMessage("");

    const form = new FormData(formElement);
    const type = String(form.get("type") ?? "bug");
    const content = String(form.get("content") ?? "").trim();
    const pageUrl = String(form.get("page_url") ?? "").trim();
    const contact = String(form.get("contact") ?? "").trim();

    if (!content) {
      setLoading(false);
      setMessage("\u5185\u5bb9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002");
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
      setMessage("\u9001\u4fe1\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u6642\u9593\u3092\u7f6e\u3044\u3066\u3082\u3046\u4e00\u5ea6\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002");
      return;
    }

    formElement.reset();
    setMessage("\u9001\u4fe1\u3057\u307e\u3057\u305f\u3002\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3059\u3002");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium">
          {"\u7a2e\u5225"}
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
          {"\u5185\u5bb9"}
        </label>
        <Textarea
          id="content"
          name="content"
          required
          className="min-h-40"
          placeholder={"\u6c17\u3065\u3044\u305f\u3053\u3068\u3001\u56f0\u3063\u305f\u3053\u3068\u3001\u8cea\u554f\u306a\u3069\u3092\u66f8\u3044\u3066\u304f\u3060\u3055\u3044\u3002"}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="page_url" className="text-sm font-medium">
          {"\u767a\u751f\u30da\u30fc\u30b8URL \u4efb\u610f"}
        </label>
        <Input id="page_url" name="page_url" type="url" placeholder="https://..." />
      </div>
      <div className="space-y-2">
        <label htmlFor="contact" className="text-sm font-medium">
          {"\u9023\u7d61\u5148 \u4efb\u610f"}
        </label>
        <Input id="contact" name="contact" placeholder={"\u8fd4\u4fe1\u304c\u5fc5\u8981\u306a\u5834\u5408\u306e\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u306a\u3069"} />
      </div>
      {message ? <p className="text-sm leading-6 text-muted-foreground">{message}</p> : null}
      <Button type="submit" disabled={loading} className="min-h-11 w-full sm:w-auto">
        {loading ? "\u9001\u4fe1\u4e2d..." : "\u9001\u4fe1\u3059\u308b"}
      </Button>
    </form>
  );
}
