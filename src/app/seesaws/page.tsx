import Link from "next/link";
import { Plus, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function MentalSeesawsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              メンタルシーソー
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              メンタルシーソーは個人的なメモ・自問自答として扱うため、ログイン中の本人だけが閲覧できます。
            </p>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/login">ログインする</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: seesawRows, error } = await supabase
    .from("mental_seesaws")
    .select("id,title,description,context,final_decision,next_action,created_at,updated_at,profiles(id,username,display_name)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) console.error(error);

  const seesaws = (seesawRows ?? []) as unknown as Array<{
    id: string;
    title: string;
    description: string | null;
    context: string | null;
    final_decision: string | null;
    next_action: string | null;
    created_at: string;
    updated_at: string;
    profiles: { id: string; username: string | null; display_name: string | null } | null;
  }>;

  return (
    <div className="container space-y-6 py-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 break-words text-3xl font-bold tracking-normal">
            <Scale className="h-7 w-7 shrink-0 text-primary" />
            メンタルシーソー
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            自分だけが見られる思考整理メモです。不満・不安・期待・改善案を、重りとして外に出して整理します。
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/seesaws/new">
            <Plus className="mr-2 h-4 w-4" />
            議題を作る
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {seesaws.length ? (
          seesaws.map((seesaw) => (
            <Card key={seesaw.id} className="w-full min-w-0 transition-colors hover:border-primary/40">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">自分用メモ</Badge>
                  <span className="text-sm text-muted-foreground">最終更新 {formatDate(seesaw.updated_at)}</span>
                </div>
                <CardTitle className="break-words leading-snug">
                  <Link href={`/seesaws/${seesaw.id}`} className="hover:text-primary">
                    {seesaw.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {seesaw.description || seesaw.context ? (
                  <p className="line-clamp-2 whitespace-pre-wrap break-words">{seesaw.description || seesaw.context}</p>
                ) : null}
                <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-3">
                  <span>{seesaw.profiles?.display_name || seesaw.profiles?.username || "匿名ユーザー"}</span>
                  {seesaw.next_action ? <span>次: {seesaw.next_action}</span> : null}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p>まだメンタルシーソーはありません。</p>
        )}
      </div>
    </div>
  );
}
