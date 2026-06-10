import { redirect } from "next/navigation";
import { createIdea } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { trustLimits } from "@/lib/trust";

const errorMessages: Record<string, string> = {
  daily_limit: "今日は投稿数が上限に達しました。少し時間を置いてから投稿してください。",
  external_link: "外部リンクを含む投稿は、もう少し活動実績が増えてから使えます。",
  image: "画像のアップロードに失敗しました。5MB以下の画像を選んでください。",
  missing: "タイトル、本文、投稿項目を確認してください。",
  recent_limit: "短時間に投稿が続いています。少し時間を置いてから投稿してください。",
  save: "投稿の保存に失敗しました。",
  serious_trust: "本気枠への投稿は、一定の活動実績ができてから使えます。まずは思いつき枠で投稿してください。",
};

export default async function NewIdeaPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("credit_score").eq("id", user.id).single();
  const creditScore = ((profile as { credit_score?: number } | null)?.credit_score ?? 0);
  const canUseSerious = creditScore >= trustLimits.seriousIdeaMinScore;

  return (
    <div className="container max-w-3xl py-6 sm:py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>アイデア投稿</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createIdea} className="space-y-5">
            {error && errorMessages[error] ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessages[error]}
              </div>
            ) : null}
            {!canUseSerious ? (
              <div className="rounded-md border bg-muted px-4 py-3 text-sm leading-6 text-muted-foreground">
                新規ユーザーは、まず「思いつき枠」から投稿できます。本気枠は活動実績が増えると使えるようになります。
              </div>
            ) : null}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                タイトル
              </label>
              <Input id="title" name="title" required maxLength={120} placeholder="例: 空いている会議室を集中部屋にする" className="min-h-11" />
            </div>
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                投稿タイプ
              </label>
              <select
                id="type"
                name="type"
                className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue="rough"
              >
                <option value="rough">rough: AI生成・思いつき枠</option>
                <option value="serious">serious: 人間が練った本気枠</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="body" className="text-sm font-medium">
                内容
              </label>
              <Textarea id="body" name="body" required placeholder="背景、誰の課題か、どう実行できそうかを書いてください。" className="min-h-36" />
            </div>
            <div className="space-y-2">
              <label htmlFor="image" className="text-sm font-medium">
                画像を添付
              </label>
              <Input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="min-h-11" />
              <p className="text-xs text-muted-foreground">PNG / JPEG / WebP / GIF、5MBまで。</p>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-medium">公開範囲</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
                  <input type="radio" name="visibility" value="public" defaultChecked className="mt-1" />
                  <span>
                    <span className="block font-medium">公開フィードに投稿</span>
                    <span className="text-sm leading-6 text-muted-foreground">全ユーザーが閲覧でき、コメントや実行報告の対象になります。</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
                  <input type="radio" name="visibility" value="private" className="mt-1" />
                  <span>
                    <span className="block font-medium">マイアイデアに保存</span>
                    <span className="text-sm leading-6 text-muted-foreground">自分だけが見られる個人メモや下書きとして保存します。</span>
                  </span>
                </label>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-medium">実行権限</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
                  <input type="radio" name="execution_permission" value="owner_only" className="mt-1" />
                  <span>
                    <span className="block font-medium">自分だけが実行する</span>
                    <span className="text-sm leading-6 text-muted-foreground">個人的な行動メモや自己改善向け。</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
                  <input type="radio" name="execution_permission" value="public" defaultChecked className="mt-1" />
                  <span>
                    <span className="block font-medium">誰でも実行できる</span>
                    <span className="text-sm leading-6 text-muted-foreground">共同開発や社会的なアイデア向け。</span>
                  </span>
                </label>
              </div>
            </div>
            <Button type="submit" className="min-h-11 w-full sm:w-auto">
              投稿する
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
