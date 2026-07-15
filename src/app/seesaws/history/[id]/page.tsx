import Link from "next/link";
import { ArrowLeft, History, Lightbulb, Pencil, RefreshCw, Send } from "lucide-react";
import { notFound } from "next/navigation";
import { deleteOrganizedWorryHistory, publishOrganizedWorryIdea } from "@/app/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { WorryOrganizationHistory } from "@/lib/database.types";

export default async function WorryHistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data, error } = await supabase
    .from("worry_organization_histories")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error || !data) notFound();
  const history = data as WorryOrganizationHistory;

  return (
    <div className="container max-w-3xl space-y-6 py-6 sm:py-8">
      <Button asChild variant="ghost" size="sm"><Link href="/seesaws"><ArrowLeft className="mr-2 h-4 w-4" />履歴一覧へ</Link></Button>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold"><History className="h-6 w-6 text-indigo-600" />整理した悩みの詳細</h1>
          {history.idea_posted ? <Badge>アイデア投稿済み</Badge> : null}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{formatDate(history.created_at)} に作成</p>
      </div>

      <div className="relative space-y-4 border-l-2 border-indigo-200 pl-6">
        <TimelineCard label="最初の入力" title={history.initial_input} />
        {history.question_answers.map((item, index) => (
          <TimelineCard key={`${index}-${item.question}`} label={`質問 ${index + 1}`} title={item.question} body={item.answer || "回答なし"} />
        ))}
        <Card>
          <CardHeader><CardTitle className="text-base">表示された選択肢・提案</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {history.displayed_options.map((option, index) => (
              <div key={`${index}-${option.title}`} className="rounded-md border p-3">
                <p className="font-semibold">{option.title}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{option.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <TimelineCard label="最終的な選択" title={history.selected_option.title} body={history.selected_option.body} selected />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">この履歴からできること</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button asChild variant="outline"><Link href={`/seesaws/${history.seesaw_id}?organize=retry&historyId=${history.id}`}><RefreshCw className="mr-2 h-4 w-4" />同じ内容でもう一度整理する</Link></Button>
          <Button asChild variant="outline"><Link href={`/seesaws/${history.seesaw_id}?organize=edit&historyId=${history.id}`}><Pencil className="mr-2 h-4 w-4" />入力内容を編集して再整理する</Link></Button>
          {history.idea_posted ? (
            history.idea_id ? <Button asChild><Link href={`/ideas/${history.idea_id}`}><Lightbulb className="mr-2 h-4 w-4" />投稿したアイデアを見る</Link></Button> : null
          ) : (
            <form action={publishOrganizedWorryIdea.bind(null, history.id)}><Button type="submit" className="w-full"><Send className="mr-2 h-4 w-4" />選択肢をアイデアとして投稿</Button></form>
          )}
          <form action={deleteOrganizedWorryHistory.bind(null, history.id)}>
            <ConfirmSubmitButton className="w-full" message="この履歴を削除しますか？この操作は取り消せません。" />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineCard({ label, title, body, selected = false }: { label: string; title: string; body?: string; selected?: boolean }) {
  return (
    <Card className={selected ? "border-indigo-400 bg-indigo-50/50" : ""}>
      <CardContent className="pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{label}</p>
        <p className="mt-2 whitespace-pre-wrap font-semibold leading-7">{title}</p>
        {body ? <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{body}</p> : null}
      </CardContent>
    </Card>
  );
}
