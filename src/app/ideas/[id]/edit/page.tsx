/* eslint-disable @next/next/no-img-element */
import { redirect } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { updateIdea } from "@/app/actions";
import { IdeaImageGrid } from "@/components/idea-image-grid";
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
  image_urls: string[] | null;
  user_id: string;
};

const errorMessages: Record<string, string> = {
  image: "画像のアップロードに失敗しました。画像は最大4枚、1枚5MB以下で選んでください。",
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
    .select("id,title,body,type,visibility,execution_permission,image_url,image_urls,user_id")
    .eq("id", id)
    .single();

  const idea = ideaResult as unknown as EditableIdea | null;
  if (error || !idea) redirect("/ideas");
  if (idea.user_id !== user.id) redirect(`/ideas/${id}`);

  const imagePaths = [...new Set([...(idea.image_urls ?? []), ...(idea.image_url ? [idea.image_url] : [])].filter(Boolean))].slice(0, 4);
  const currentImages = (
    await Promise.all(
      imagePaths.map(async (path) => {
        const { data } = await supabase.storage.from("idea-images").createSignedUrl(path, 60 * 60);
        return data?.signedUrl ? { path, url: data.signedUrl } : null;
      }),
    )
  ).filter((image): image is { path: string; url: string } => Boolean(image));

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
                <option value="rough">💡 アイデア枠</option>
                <option value="serious">🚀 プロジェクト枠</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="body" className="text-sm font-medium">
                内容
              </label>
              <Textarea id="body" name="body" required defaultValue={idea.body} />
            </div>
            <div className="space-y-3">
              <label htmlFor="images" className="text-sm font-medium">
                画像
              </label>
              <IdeaImageGrid images={currentImages.map((image) => image.url)} />
              {currentImages.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {currentImages.map((image, index) => (
                    <label key={image.path} className="flex cursor-pointer gap-3 rounded-md border p-3">
                      <img src={image.url} alt="" className="h-20 w-20 shrink-0 rounded-md border object-cover" />
                      <span className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                        <span className="text-sm font-medium">画像 {index + 1}</span>
                        <span className="flex items-center gap-2 text-sm text-destructive">
                          <input type="checkbox" name="remove_image_urls" value={image.path} className="h-4 w-4" />
                          <Trash2 className="h-4 w-4" />
                          削除する
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}
              <Input id="images" name="images" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple />
              <p className="text-xs text-muted-foreground">新しく画像を選ぶと、既存画像をまとめて差し替えます。PNG / JPEG / WebP / GIF、最大4枚、1枚5MBまで。</p>
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
