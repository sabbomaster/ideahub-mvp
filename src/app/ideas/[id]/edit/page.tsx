/* eslint-disable @next/next/no-img-element */
import { redirect } from "next/navigation";
import Link from "next/link";
import { updateIdea } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import type { ExecutionPermission, IdeaType, IdeaVisibility } from "@/lib/database.types";

type EditableIdea = {
  id: string;
  title: string;
  body: string;
  type: IdeaType;
  visibility: IdeaVisibility;
  execution_permission: ExecutionPermission;
  image_url: string | null;
  user_id: string;
};

const errorMessages: Record<string, string> = {
  image: "画像のアップロードに失敗しました。5MB以下の画像を選んでください。",
  missing: "タイトル、本文、投稿項目を確認してください。",
  save: "保存に失敗しました。",
};

export default async function EditIdeaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorCode } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: ideaResult, error } = await supabase
    .from("ideas")
    .select("id,title,body,type,visibility,execution_permission,image_url,user_id")
    .eq("id", id)
    .single();

  const idea = ideaResult as unknown as EditableIdea | null;
  if (error || !idea) redirect("/ideas");
  if (idea.user_id !== user.id) redirect(`/ideas/${id}`);

  const currentImageUrl = idea.image_url
    ? (await supabase.storage.from("idea-images").createSignedUrl(idea.image_url, 60 * 60)).data?.signedUrl ?? null
    : null;

  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>アイデア編集</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateIdea.bind(null, id)} className="space-y-5">
            {errorCode && errorMessages[errorCode] ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessages[errorCode]}
              </div>
            ) : null}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                タイトル
              </label>
              <Input id="title" name="title" required maxLength={120} defaultValue={idea.title} />
            </div>
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                投稿タイプ
              </label>
              <select
                id="type"
                name="type"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue={idea.type}
              >
                <option value="rough">rough: AI生成・思いつき枠</option>
                <option value="serious">serious: 人間が練った本気枠</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="body" className="text-sm font-medium">
                内容
              </label>
              <Textarea id="body" name="body" required defaultValue={idea.body} />
            </div>
            <div className="space-y-3">
              <label htmlFor="image" className="text-sm font-medium">
                画像
              </label>
              {currentImageUrl ? (
                <img src={currentImageUrl} alt="" className="aspect-video w-full rounded-md border object-cover" />
              ) : null}
              <Input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
              <p className="text-xs text-muted-foreground">新しい画像を選ぶと差し替えます。PNG / JPEG / WebP / GIF、5MBまで。</p>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-medium">公開範囲</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
                  <input type="radio" name="visibility" value="public" defaultChecked={idea.visibility === "public"} className="mt-1" />
                  <span>
                    <span className="block font-medium">公開フィードに投稿</span>
                    <span className="text-sm text-muted-foreground">全ユーザーが閲覧でき、コメントや実行報告の対象になります。</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
                  <input type="radio" name="visibility" value="private" defaultChecked={idea.visibility === "private"} className="mt-1" />
                  <span>
                    <span className="block font-medium">マイアイデアに保存</span>
                    <span className="text-sm text-muted-foreground">自分だけが見られる個人メモや下書きとして保存します。</span>
                  </span>
                </label>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-medium">実行権限</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
                  <input type="radio" name="execution_permission" value="owner_only" defaultChecked={idea.execution_permission === "owner_only"} className="mt-1" />
                  <span>
                    <span className="block font-medium">自分だけが実行する</span>
                    <span className="text-sm text-muted-foreground">個人的な行動メモや自己改善向け。</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4">
                  <input type="radio" name="execution_permission" value="public" defaultChecked={idea.execution_permission === "public"} className="mt-1" />
                  <span>
                    <span className="block font-medium">誰でも実行できる</span>
                    <span className="text-sm text-muted-foreground">共同開発や社会的なアイデア向け。</span>
                  </span>
                </label>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit">保存する</Button>
              <Button asChild variant="outline">
                <Link href={`/ideas/${id}`}>戻る</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
