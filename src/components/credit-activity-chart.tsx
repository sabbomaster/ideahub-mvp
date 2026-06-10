import Link from "next/link";
import { BarChart3, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CreditActivityChartProps = {
  mode: "bar" | "radar";
  stats: {
    ideas: number;
    executions: number;
    improvements: number;
  };
};

const labels = [
  { key: "ideas", label: "アイデア投稿" },
  { key: "executions", label: "実行" },
  { key: "improvements", label: "改善提案" },
] as const;

export function CreditActivityChart({ mode, stats }: CreditActivityChartProps) {
  const max = Math.max(stats.ideas, stats.executions, stats.improvements, 1);
  const top = labels.reduce((best, item) => (stats[item.key] > stats[best.key] ? item : best), labels[0]);
  const primaryType =
    stats[top.key] === 0 ? "これから育つタイプ" : top.key === "ideas" ? "提案型" : top.key === "executions" ? "実行型" : "改善型";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">活動タイプ</div>
          <div className="text-2xl font-bold">{primaryType}</div>
          <div className="mt-1 text-sm text-muted-foreground">投稿・実行・改善の内訳</div>
        </div>
        <div className="flex gap-1 rounded-md border bg-background p-1">
          <Button asChild variant={mode === "bar" ? "secondary" : "ghost"} size="sm" aria-label="棒グラフ">
            <Link href="?chart=bar">
              <BarChart3 className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant={mode === "radar" ? "secondary" : "ghost"} size="sm" aria-label="レーダーチャート">
            <Link href="?chart=radar">
              <Radar className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {mode === "bar" ? <BarView stats={stats} max={max} /> : <RadarView stats={stats} max={max} />}
    </div>
  );
}

function BarView({ stats, max }: { stats: CreditActivityChartProps["stats"]; max: number }) {
  return (
    <div className="space-y-3">
      {labels.map((item) => {
        const value = stats[item.key];
        const width = value === 0 ? 0 : Math.max(8, (value / max) * 100);
        return (
          <div key={item.key} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{item.label}</span>
              <span className="tabular-nums text-muted-foreground">{value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full bg-primary", value === 0 ? "w-0" : "")} style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RadarView({ stats, max }: { stats: CreditActivityChartProps["stats"]; max: number }) {
  const center = 84;
  const radius = 64;
  const angles = [-90, 30, 150];
  const points = labels
    .map((item, index) => {
      const ratio = stats[item.key] / max;
      const angle = (angles[index] * Math.PI) / 180;
      return `${center + Math.cos(angle) * radius * ratio},${center + Math.sin(angle) * radius * ratio}`;
    })
    .join(" ");
  const guidePoints = angles
    .map((angleValue) => {
      const angle = (angleValue * Math.PI) / 180;
      return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
    })
    .join(" ");

  return (
    <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
      <svg viewBox="0 0 168 168" className="mx-auto h-44 w-44">
        <polygon points={guidePoints} className="fill-muted stroke-border" strokeWidth="1" />
        {[0.33, 0.66].map((scale) => {
          const scaled = angles
            .map((angleValue) => {
              const angle = (angleValue * Math.PI) / 180;
              return `${center + Math.cos(angle) * radius * scale},${center + Math.sin(angle) * radius * scale}`;
            })
            .join(" ");
          return <polygon key={scale} points={scaled} className="fill-transparent stroke-border" strokeWidth="1" />;
        })}
        {angles.map((angleValue) => {
          const angle = (angleValue * Math.PI) / 180;
          return <line key={angleValue} x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} className="stroke-border" strokeWidth="1" />;
        })}
        <polygon points={points} className="fill-primary/30 stroke-primary" strokeWidth="2" />
      </svg>
      <div className="space-y-2">
        {labels.map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
            <span>{item.label}</span>
            <span className="font-semibold tabular-nums">{stats[item.key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
