import { notFound } from "next/navigation";
import Link from "next/link";
import { Lightbulb, Minus, Plus, Send } from "lucide-react";
import {
  addMentalSeesawItem,
  addSelfQuestionMemo,
  deleteMentalSeesawItem,
  deleteSelfQuestionMemo,
  publishMentalSeesawReliefIdea,
  updateMentalSeesawItem,
  updateMentalSeesawMeta,
  updateMentalSeesawOutcome,
  updateSelfQuestionMemo,
} from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { cn, formatDate } from "@/lib/utils";
import type { MentalSeesawItemKind } from "@/lib/database.types";

type SeesawData = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  context: string | null;
  final_decision: string | null;
  next_action: string | null;
  created_at: string;
  updated_at: string;
  profiles: { id: string; username: string | null; display_name: string | null } | null;
};

type SeesawItemData = {
  id: string;
  kind: MentalSeesawItemKind;
  content: string;
  weight: number;
  relief_method: string | null;
  created_at: string;
};

type SelfQuestionMemoData = {
  id: string;
  body: string;
  created_at: string;
};

const weightOptions = [1, 2, 3, 4, 5, 6];

export default async function MentalSeesawDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; metaError?: string }>;
}) {
  const { id } = await params;
  const { error: errorCode, metaError } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: seesawResult, error: seesawError } = await supabase
    .from("mental_seesaws")
    .select("id,user_id,title,description,context,final_decision,next_action,created_at,updated_at,profiles(id,username,display_name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (seesawError || !seesawResult) {
    console.error(seesawError);
    notFound();
  }

  const seesaw = seesawResult as unknown as SeesawData;
  const isOwner = user?.id === seesaw.user_id;
  const [{ data: itemRows, error: itemError }, { data: memoRows, error: memoError }] = await Promise.all([
    supabase
      .from("mental_seesaw_items")
      .select("id,kind,content,weight,relief_method,created_at")
      .eq("seesaw_id", id)
      .order("created_at", { ascending: true }),
    isOwner
      ? supabase
          .from("mental_seesaw_suggestions")
          .select("id,body,created_at")
          .eq("seesaw_id", id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (itemError) console.error(itemError);
  if (memoError) console.error(memoError);

  const items = (itemRows ?? []) as unknown as SeesawItemData[];
  const memos = (memoRows ?? []) as unknown as SelfQuestionMemoData[];
  const positives = items.filter((item) => item.kind === "positive");
  const negatives = items.filter((item) => item.kind === "negative");
  const positiveTotal = positives.reduce((total, item) => total + item.weight, 0);
  const negativeTotal = negatives.reduce((total, item) => total + item.weight, 0);
  const diff = negativeTotal - positiveTotal;
  const tiltDegrees = Math.max(-11, Math.min(11, diff * 1.25));
  const stateText =
    positiveTotal === negativeTotal
      ? "ほぼ均衡しています"
      : positiveTotal > negativeTotal
        ? "ポジティブがやや大きい"
        : "ネガティブがやや大きい";
  const author = seesaw.profiles?.display_name || seesaw.profiles?.username || "匿名ユーザー";
  const description = seesaw.description ?? seesaw.context ?? "";

  return (
    <div className="container space-y-6 py-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">メンタルシーソー</Badge>
          <span className="text-sm text-muted-foreground">最終更新 {formatDate(seesaw.updated_at)}</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          {isOwner ? (
            <form action={updateMentalSeesawMeta.bind(null, id)} className="min-w-0 flex-1 space-y-3">
              <div className="space-y-2">
                <label htmlFor="seesaw-title" className="text-sm font-medium">
                  議題名
                </label>
                <Input id="seesaw-title" name="title" required defaultValue={seesaw.title} className="text-lg font-semibold" />
              </div>
              <div className="space-y-2">
                <label htmlFor="seesaw-description" className="text-sm font-medium">
                  説明文
                </label>
                <Textarea
                  id="seesaw-description"
                  name="description"
                  defaultValue={description}
                  placeholder="何に迷っているか、どんな不安や期待があるかを書き出します。"
                  className="min-h-[96px]"
                />
              </div>
              {metaError === "save" ? <p className="text-sm font-medium text-destructive">保存に失敗しました</p> : null}
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit">議題を保存</Button>
                <span className="text-sm text-muted-foreground">
                  by{" "}
                  <Link href={`/profiles/${seesaw.profiles?.id ?? seesaw.user_id}`} className="font-medium text-foreground hover:text-primary">
                    {author}
                  </Link>
                </span>
              </div>
            </form>
          ) : (
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold tracking-normal">{seesaw.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                by{" "}
                <Link href={`/profiles/${seesaw.profiles?.id ?? seesaw.user_id}`} className="font-medium text-foreground hover:text-primary">
                  {author}
                </Link>
              </p>
            </div>
          )}
          <Button asChild variant="outline">
            <Link href="/seesaws">一覧へ</Link>
          </Button>
        </div>
        {!isOwner && description ? <p className="max-w-4xl whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{description}</p> : null}
        {errorCode ? <p className="text-sm font-medium text-destructive">操作に失敗しました。入力内容や権限を確認してください。</p> : null}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(250px,360px)_1fr_minmax(250px,360px)]">
        <EntryPanel kind="positive" seesawId={id} items={positives} isOwner={isOwner} total={positiveTotal} />
        <SeesawStage
          positives={positives}
          negatives={negatives}
          positiveTotal={positiveTotal}
          negativeTotal={negativeTotal}
          stateText={stateText}
          tiltDegrees={tiltDegrees}
        />
        <EntryPanel kind="negative" seesawId={id} items={negatives} isOwner={isOwner} total={negativeTotal} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <ReliefProposalPanel seesawId={id} negatives={negatives} isOwner={isOwner} />
        {isOwner ? <SelfQuestionMemoPanel seesawId={id} memos={memos} /> : null}
      </section>

      <Card className="border-violet-200 bg-violet-50/40">
        <CardHeader>
          <CardTitle className="text-lg text-violet-700">最終判断と次の行動</CardTitle>
        </CardHeader>
        <CardContent>
          {isOwner ? (
            <form action={updateMentalSeesawOutcome.bind(null, id)} className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <div className="space-y-2">
                <label htmlFor="final_decision" className="text-sm font-medium text-violet-800">
                  最終判断
                </label>
                <select
                  id="final_decision"
                  name="final_decision"
                  defaultValue={seesaw.final_decision ?? ""}
                  className="h-10 w-full rounded-md border border-violet-200 bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">未定</option>
                  <option value="やる">やる</option>
                  <option value="保留">保留</option>
                  <option value="やらない">やらない</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="next_action" className="text-sm font-medium text-violet-800">
                  次の行動
                </label>
                <Input id="next_action" name="next_action" placeholder="例: まず小さく試作品を作ってみる" defaultValue={seesaw.next_action ?? ""} />
              </div>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                保存する
              </Button>
            </form>
          ) : (
            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <div className="font-medium">判断</div>
                <p className="mt-1 text-muted-foreground">{seesaw.final_decision || "未記録"}</p>
              </div>
              <div>
                <div className="font-medium">次の行動</div>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{seesaw.next_action || "未記録"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EntryPanel({
  kind,
  seesawId,
  items,
  isOwner,
  total,
}: {
  kind: MentalSeesawItemKind;
  seesawId: string;
  items: SeesawItemData[];
  isOwner: boolean;
  total: number;
}) {
  const isPositive = kind === "positive";
  return (
    <Card className={cn(isPositive ? "border-emerald-300 bg-emerald-50/50" : "border-rose-300 bg-rose-50/50")}>
      <CardHeader>
        <CardTitle className={cn("text-lg", isPositive ? "text-emerald-700" : "text-rose-700")}>
          {isPositive ? "ポジティブを記入" : "ネガティブを記入"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{isPositive ? "良いこと・期待・メリットなど" : "不安・リスク・懸念など"}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOwner ? (
          <form action={addMentalSeesawItem.bind(null, seesawId, kind)} className="space-y-4">
            <Textarea
              name="content"
              placeholder={isPositive ? "例: このアイデアは人の役に立つかもしれない" : "例: 失敗するかもしれない"}
              required
              className="min-h-[72px]"
            />
            <WeightPicker name="weight" defaultValue={isPositive ? 4 : 6} tone={kind} />
            {isPositive ? null : <Input name="relief_method" placeholder="どう軽くするか・どう改善するか" />}
            <Button type="submit" className={cn("w-full", isPositive ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-500 hover:bg-rose-600")}>
              追加する
            </Button>
          </form>
        ) : null}

        <div className="border-t pt-4">
          <div className="mb-3 text-sm font-medium">{isPositive ? "ポジティブ項目一覧" : "ネガティブ項目一覧"}</div>
          <div className="space-y-2">
            {items.map((item) => (
              <CompactItemEditor key={item.id} item={item} seesawId={seesawId} isOwner={isOwner} tone={kind} />
            ))}
            {!items.length ? <p className="text-sm text-muted-foreground">まだ項目がありません。</p> : null}
          </div>
          <div className={cn("mt-4 text-right text-lg font-bold", isPositive ? "text-emerald-700" : "text-rose-600")}>合計重量: {total}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeightPicker({ name, defaultValue, tone }: { name: string; defaultValue: number; tone: MentalSeesawItemKind }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">重さを設定 1〜6</div>
      <div className="grid grid-cols-6 gap-2">
        {weightOptions.map((weight) => (
          <label key={weight} className="relative">
            <input className="peer sr-only" type="radio" name={name} value={weight} defaultChecked={weight === defaultValue} />
            <span
              className={cn(
                "flex h-10 items-center justify-center rounded-full border bg-background text-sm font-medium transition-colors peer-checked:text-white",
                tone === "positive" ? "peer-checked:border-emerald-600 peer-checked:bg-emerald-600" : "peer-checked:border-rose-500 peer-checked:bg-rose-500",
              )}
            >
              {weight}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function CompactItemEditor({
  item,
  seesawId,
  isOwner,
  tone,
}: {
  item: SeesawItemData;
  seesawId: string;
  isOwner: boolean;
  tone: MentalSeesawItemKind;
}) {
  const isPositive = tone === "positive";
  if (!isOwner) {
    return (
      <div className="rounded-md border bg-background px-3 py-2 text-sm">
        <div className="space-y-2">
          <p className="whitespace-pre-wrap break-words leading-6">{item.content}</p>
          <div className="flex justify-end">
            <Badge variant={isPositive ? "default" : "secondary"}>重さ: {item.weight}</Badge>
          </div>
        </div>
        {item.relief_method ? <p className="mt-1 text-muted-foreground">再提案: {item.relief_method}</p> : null}
      </div>
    );
  }

  return (
    <form action={updateMentalSeesawItem.bind(null, seesawId, item.id)} className="space-y-3 rounded-md border bg-background p-3">
      <Textarea name="content" defaultValue={item.content} required className="min-h-[84px] w-full resize-y leading-6" />
      {isPositive ? null : (
        <Textarea
          name="relief_method"
          defaultValue={item.relief_method ?? ""}
          placeholder="どう軽くするか・どう改善するか"
          className="min-h-[72px] w-full resize-y leading-6"
        />
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm">
          <span className="shrink-0 text-muted-foreground">重さ</span>
          <Input name="weight" type="number" min={1} max={6} defaultValue={item.weight} className="w-24" />
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="submit" size="sm" variant="outline">
            更新
          </Button>
          <Button formAction={deleteMentalSeesawItem.bind(null, seesawId, item.id)} variant="ghost" size="sm">
            <Minus className="mr-2 h-4 w-4" />
            削除
          </Button>
        </div>
      </div>
    </form>
  );
}

function SeesawStage({
  positives,
  negatives,
  positiveTotal,
  negativeTotal,
  stateText,
  tiltDegrees,
}: {
  positives: SeesawItemData[];
  negatives: SeesawItemData[];
  positiveTotal: number;
  negativeTotal: number;
  stateText: string;
  tiltDegrees: number;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">シーソーのバランス</CardTitle>
          <div className="flex flex-wrap gap-4 text-sm font-semibold">
            <span className="text-emerald-700">ポジティブ合計: {positiveTotal}</span>
            <span className="text-rose-600">ネガティブ合計: {negativeTotal}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto min-h-[540px] overflow-hidden rounded-md bg-gradient-to-b from-white to-muted/40 p-4 sm:min-h-[500px]">
          <div className="absolute left-1/2 top-[52%] z-10 h-0 w-0 -translate-x-1/2 border-x-[34px] border-b-[64px] border-x-transparent border-b-foreground/75 sm:border-x-[38px] sm:border-b-[70px]" />
          <div
            className="absolute left-[8%] right-[8%] top-[50%] h-3 origin-center rounded-full bg-foreground/80 shadow-lg transition-transform sm:top-[52%]"
            style={{ transform: `rotate(${tiltDegrees}deg)` }}
          />
          <div className="absolute left-[8%] right-[8%] top-[50%] transition-transform sm:top-[52%]" style={{ transform: `rotate(${tiltDegrees}deg)` }}>
            <WeightStack items={positives} side="left" />
            <WeightStack items={negatives} side="right" />
          </div>
          <div className="absolute bottom-5 left-4 right-4 rounded-md border bg-card/95 p-4 text-center shadow-sm">
            <div className="text-base font-bold sm:text-lg">
              現在の状態: <span className={positiveTotal >= negativeTotal ? "text-emerald-700" : "text-rose-600"}>{stateText}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              ネガティブが重い時は、要因を小さくする方法や別行動を書いて軽くしてみましょう。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeightStack({ items, side }: { items: SeesawItemData[]; side: "left" | "right" }) {
  const visibleItems = items.slice(0, 4);
  return (
    <div
      className={cn(
        "absolute top-[-165px] flex w-[44%] max-w-[270px] flex-col-reverse gap-2 sm:top-[-155px]",
        side === "left" ? "left-[2%] items-start" : "right-[2%] items-end",
      )}
    >
      {visibleItems.map((item) => (
        <div
          key={item.id}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-center text-xs font-semibold shadow-sm sm:text-sm",
            side === "left" ? "border-emerald-400 bg-emerald-100 text-emerald-950" : "border-rose-400 bg-rose-100 text-rose-950",
          )}
        >
          <div>重さ: {item.weight}</div>
          <div className="mt-1 line-clamp-2">{item.content}</div>
        </div>
      ))}
    </div>
  );
}

function ReliefProposalPanel({ seesawId, negatives, isOwner }: { seesawId: string; negatives: SeesawItemData[]; isOwner: boolean }) {
  return (
    <Card className="border-blue-200 bg-blue-50/40">
      <CardHeader>
        <CardTitle className="text-lg text-blue-700">ネガティブ項目への再提案</CardTitle>
        <p className="text-sm text-muted-foreground">どうするか、どう軽くするかを具体化します。</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {negatives.map((item) => (
          <form key={item.id} action={updateMentalSeesawItem.bind(null, seesawId, item.id)} className="rounded-md border bg-background p-3">
            <div className="mb-2 text-sm font-medium">{item.content}</div>
            <input type="hidden" name="content" value={item.content} />
            <input type="hidden" name="weight" value={item.weight} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                name="relief_method"
                defaultValue={item.relief_method ?? ""}
                placeholder="例: 小さく試して、検証しながら進める"
                disabled={!isOwner}
              />
              {isOwner ? (
                <Button type="submit" variant="outline">
                  保存
                </Button>
              ) : null}
            </div>
            {isOwner ? (
              <Button formAction={publishMentalSeesawReliefIdea.bind(null, seesawId, item.id)} className="mt-3 w-full bg-blue-600 hover:bg-blue-700">
                <Send className="mr-2 h-4 w-4" />
                再提案をアイデアハブに投稿
              </Button>
            ) : null}
          </form>
        ))}
        {!negatives.length ? <p className="text-sm text-muted-foreground">ネガティブ項目を追加すると、再提案欄が表示されます。</p> : null}
      </CardContent>
    </Card>
  );
}

function SelfQuestionMemoPanel({ seesawId, memos }: { seesawId: string; memos: SelfQuestionMemoData[] }) {
  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-amber-700">
          <Lightbulb className="h-5 w-5" />
          自問自答メモ
        </CardTitle>
        <p className="text-sm text-muted-foreground">前提の見直しや、別角度の考え方を自分用に記録します。</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={addSelfQuestionMemo.bind(null, seesawId)} className="space-y-3">
          <Textarea name="body" placeholder="例: そもそも前提は正しい？別の選択肢はない？" required className="min-h-[96px]" />
          <Button type="submit" size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            メモを追加
          </Button>
        </form>
        <div className="space-y-2">
          {memos.map((memo) => (
            <form key={memo.id} action={updateSelfQuestionMemo.bind(null, seesawId, memo.id)} className="space-y-3 rounded-md border bg-background p-3 text-sm">
              <div className="text-xs text-muted-foreground">{formatDate(memo.created_at)}</div>
              <Textarea name="body" defaultValue={memo.body} required className="min-h-[96px] leading-6" />
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="submit" size="sm" variant="outline">
                  更新
                </Button>
                <Button formAction={deleteSelfQuestionMemo.bind(null, seesawId, memo.id)} size="sm" variant="ghost">
                  <Minus className="mr-2 h-4 w-4" />
                  削除
                </Button>
              </div>
            </form>
          ))}
          {!memos.length ? <p className="text-sm text-muted-foreground">まだ自問自答メモはありません。</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
