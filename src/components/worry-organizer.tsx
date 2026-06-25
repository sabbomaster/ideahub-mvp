"use client";

import { useMemo, useState } from "react";
import { Lightbulb, Send, Sparkles } from "lucide-react";
import { publishOrganizedWorryIdea } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { IdeaType } from "@/lib/database.types";

type WorryOrganizerProps = {
  negatives: Array<{ content: string; relief_method: string | null; weight: number }>;
  seesawId: string;
  seesawTitle: string;
};

type OrganizerMode = "gentle" | "deep";

const modeLabels: Record<OrganizerMode, string> = {
  gentle: "やさしく整理する",
  deep: "本質まで掘り下げる",
};

const modeDescriptions: Record<OrganizerMode, string> = {
  gentle: "心理的な負担を小さくしながら、今の悩みを少しずつ言葉にします。",
  deep: "「なぜ？」を中心に、原因を段階的にたどって本質的な課題を探します。",
};

const questionsByMode: Record<OrganizerMode, string[]> = {
  gentle: [
    "そのしんどさは、いつ頃から強くなった感じがありますか？",
    "いま一番気になっている部分を、少しだけ言葉にすると何に近いですか？",
    "どんな時に、特にそう感じやすいですか？",
    "もし一つだけ楽にできるとしたら、何が変わると助かりそうですか？",
  ],
  deep: [
    "いま一番気になっていることは何ですか？",
    "それが気になるのは、なぜだと思いますか？",
    "その原因をもう一段だけ具体的にすると、何がありそうですか？",
    "さらに奥にある原因や前提は、どんなものかもしれませんか？",
    "ここまで見て、本当に変えたい課題は何に近いですか？",
  ],
};

function pickMainWorry(negatives: WorryOrganizerProps["negatives"]) {
  return [...negatives].sort((a, b) => b.weight - a.weight)[0]?.content ?? "";
}

function buildCoreIssue(mainWorry: string, answers: string[], mode: OrganizerMode) {
  const normalizedAnswers = answers.map((answer) => answer.trim());
  const [first, second, third, fourth, fifth] = normalizedAnswers;

  if (mode === "deep") {
    return [
      first ? `最初に気になっていたことは「${first}」です。` : mainWorry ? `最初の入口は「${mainWorry}」です。` : "まだ言葉になりきっていない悩みがあります。",
      second ? `その背景には「${second}」がありそうです。` : null,
      third ? `具体的には「${third}」が負担を強めているかもしれません。` : null,
      fourth ? `さらに奥には「${fourth}」という原因や前提がありそうです。` : null,
      fifth ? `本質的な課題は「${fifth}」に近そうです。` : "本質的な課題は、原因を小さく分けて次に変えられる一点を見つけることです。",
    ]
      .filter(Boolean)
      .join("\n");
  }

  const [since, focus, painfulMoment, desiredChange] = normalizedAnswers;
  return [
    focus ? `気になっている中心は「${focus}」に近そうです。` : mainWorry ? `まず中心には「${mainWorry}」がありそうです。` : "まだ言葉になりきっていない不安がありそうです。",
    painfulMoment ? `特につらいのは「${painfulMoment}」の場面です。` : null,
    since ? `それは「${since}」あたりから強くなっているかもしれません。` : null,
    desiredChange ? `本当の課題は「${desiredChange}」を少しでも実現できる状態に近づけることです。` : "本当の課題は、負担を小さくして次に取れる行動を見つけることです。",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildIdeas(mainWorry: string, answers: string[], mode: OrganizerMode) {
  const normalizedAnswers = answers.map((answer) => answer.trim());
  const focus = (mode === "deep" ? normalizedAnswers[0] : normalizedAnswers[1]) || mainWorry || "いまの悩み";
  const painfulMoment = mode === "deep" ? normalizedAnswers[2] || normalizedAnswers[3] : normalizedAnswers[2];
  const desiredChange = mode === "deep" ? normalizedAnswers[4] : normalizedAnswers[3];
  const target = desiredChange || focus;

  return [
    {
      title: `${target}を小さく試す`,
      body: `いきなり大きく変えようとせず、「${target}」を少し楽にする小さな実験を1つ決める。\n\n最初の一歩:\n今日できる10分以内の行動を1つだけ選ぶ。`,
      type: "rough" as IdeaType,
    },
    {
      title: `${focus}の負担を見える化する`,
      body: `悩みを抱え込まず、「何が重いのか」を外に出して整理する。\n\n見るポイント:\n- 自分で変えられること\n- 誰かに相談できること\n- 今は保留してよいこと${painfulMoment ? `\n\n特に見る場面:\n${painfulMoment}` : ""}`,
      type: "rough" as IdeaType,
    },
    {
      title: `${target}を改善する小さなプロジェクト`,
      body: `本当の課題に近そうな「${target}」を、1週間の小さな改善テーマとして扱う。\n\n進め方:\n1. いま困っている場面を1つ選ぶ\n2. 変えられる条件を1つだけ決める\n3. 試した結果を記録する\n4. うまくいった部分だけ続ける`,
      type: "serious" as IdeaType,
    },
  ];
}

export function WorryOrganizer({ negatives, seesawId, seesawTitle }: WorryOrganizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<OrganizerMode | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const mainWorry = useMemo(() => pickMainWorry(negatives), [negatives]);
  const questions = mode ? questionsByMode[mode] : [];
  const hasNegative = negatives.length > 0;
  const isComplete = step >= questions.length;
  const coreIssue = useMemo(() => buildCoreIssue(mainWorry, answers, mode ?? "gentle"), [answers, mainWorry, mode]);
  const ideas = useMemo(() => buildIdeas(mainWorry, answers, mode ?? "gentle"), [answers, mainWorry, mode]);

  if (!hasNegative) return null;

  function updateAnswer(value: string) {
    setAnswers((current) => current.map((answer, index) => (index === step ? value : answer)));
  }

  function startMode(nextMode: OrganizerMode) {
    setMode(nextMode);
    setStep(0);
    setAnswers(questionsByMode[nextMode].map(() => ""));
  }

  return (
    <Card className="border-indigo-200 bg-indigo-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-indigo-700">
          <Sparkles className="h-5 w-5" />
          悩みを整理する
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          ネガティブに書いた内容から、本当の課題と次に試せる改善案を一緒に見つけます。
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isOpen ? (
          <Button type="button" className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto" onClick={() => setIsOpen(true)}>
            <Lightbulb className="mr-2 h-4 w-4" />
            本当の課題を見つける
          </Button>
        ) : null}

        {isOpen && !mode ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {(["gentle", "deep"] as OrganizerMode[]).map((option) => (
              <button
                key={option}
                type="button"
                className="rounded-md border bg-background p-4 text-left transition-colors hover:border-indigo-400 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => startMode(option)}
              >
                <div className="font-semibold text-indigo-700">{modeLabels[option]}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{modeDescriptions[option]}</p>
              </button>
            ))}
          </div>
        ) : null}

        {isOpen && mode && !isComplete ? (
          <div className="space-y-4 rounded-md border bg-background p-4">
            <div className="text-sm font-medium text-indigo-700">
              {modeLabels[mode]}・質問 {step + 1} / {questions.length}
            </div>
            <label className="block space-y-2">
              <span className="text-base font-semibold">{questions[step]}</span>
              <Textarea value={answers[step]} onChange={(event) => updateAnswer(event.target.value)} className="min-h-[112px]" autoFocus />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
                戻る
              </Button>
              <Button type="button" onClick={() => setStep((current) => current + 1)} className="bg-indigo-600 hover:bg-indigo-700">
                {step === questions.length - 1 ? "整理する" : "次へ"}
              </Button>
            </div>
          </div>
        ) : null}

        {isOpen && mode && isComplete ? (
          <div className="space-y-4">
            <div className="rounded-md border bg-background p-4">
              <div className="text-sm font-medium text-indigo-700">本質的な課題</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{coreIssue}</p>
            </div>

            <div className="grid gap-3">
              {ideas.map((idea, index) => (
                <form key={`${idea.title}-${index}`} action={publishOrganizedWorryIdea.bind(null, seesawId)} className="rounded-md border bg-background p-4">
                  <input type="hidden" name="title" value={idea.title} />
                  <input type="hidden" name="body" value={[`メンタルシーソー「${seesawTitle}」で整理した悩みからの改善案です。`, "", coreIssue, "", idea.body].join("\n")} />
                  <input type="hidden" name="type" value={idea.type} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                      {idea.type === "serious" ? "プロジェクト投稿向け" : "Idea投稿向け"}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold">{idea.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{idea.body}</p>
                  <Button type="submit" className="mt-4 w-full sm:w-auto">
                    <Send className="mr-2 h-4 w-4" />
                    {idea.type === "serious" ? "プロジェクト投稿として保存" : "Idea投稿として保存"}
                  </Button>
                </form>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                同じモードでもう一度整理する
              </Button>
              <Button type="button" variant="ghost" onClick={() => startMode(mode === "gentle" ? "deep" : "gentle")}>
                {mode === "gentle" ? "本質まで掘り下げる" : "やさしく整理する"}に切り替える
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
