import { redirect } from "next/navigation";
import { NewIdeaForm } from "@/components/new-idea-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const errorMessages: Record<string, string> = {
  daily_limit: "今日は投稿数が上限に達しました。少し時間を置いてから投稿してください。",
  external_link: "外部リンクを含む投稿は、もう少し活動実績が増えてから使えます。",
  image: "画像のアップロードに失敗しました。画像は最大4枚、1枚5MB以下で選んでください。",
  missing: "タイトル、本文、投稿項目を確認してください。",
  recent_limit: "短時間に投稿が続いています。少し時間を置いてから投稿してください。",
  save: "投稿の保存に失敗しました。",
};

export default async function NewIdeaPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="container max-w-3xl py-6 sm:py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>アイデア投稿</CardTitle>
        </CardHeader>
        <CardContent>
          {error && errorMessages[error] ? (
            <div className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessages[error]}
            </div>
          ) : null}
          <NewIdeaForm currentUserId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
