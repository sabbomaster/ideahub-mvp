import Link from "next/link";
import { Plus, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function MentalSeesawsPage() {
  const supabase = await createClient();
  const { data: seesawRows, error } = await supabase
    .from("mental_seesaws")
    .select("id,title,description,context,final_decision,next_action,created_at,updated_at,profiles(id,username,display_name)")
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
    <div className="container space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-normal">
            <Scale className="h-7 w-7 text-primary" />
            メンタルシーソー
          </h1>
          <p className="mt-2 text-muted-foreground">
            不満・不安・期待・改善案を、重りとして外に出して整理します。
          </p>
        </div>
        <Button asChild>
          <Link href="/seesaws/new">
            <Plus className="mr-2 h-4 w-4" />
            議題を作る
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {seesaws.length ? (
          seesaws.map((seesaw) => (
            <Card key={seesaw.id} className="transition-colors hover:border-primary/40">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">思考整理</Badge>
                  <span className="text-sm text-muted-foreground">最終更新 {formatDate(seesaw.updated_at)}</span>
                </div>
                <CardTitle className="leading-snug">
                  <Link href={`/seesaws/${seesaw.id}`} className="hover:text-primary">
                    {seesaw.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {seesaw.description || seesaw.context ? (
                  <p className="line-clamp-2 whitespace-pre-wrap">{seesaw.description || seesaw.context}</p>
                ) : null}
                <div>
                  {seesaw.profiles?.display_name || seesaw.profiles?.username || "匿名ユーザー"}
                  {seesaw.next_action ? <span className="ml-3">次: {seesaw.next_action}</span> : null}
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
