import { FeedbackReportForm } from "@/components/feedback-report-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FeedbackPage() {
  return (
    <div className="container max-w-2xl py-6 sm:py-8">
      <Card>
        <CardHeader>
          <CardTitle>質問・不具合報告</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">
            バグ、質問、改善要望などを送れます。ログインしていなくても送信できます。
          </p>
          <FeedbackReportForm />
        </CardContent>
      </Card>
    </div>
  );
}
