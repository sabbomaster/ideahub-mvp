import { FeedbackReportForm } from "@/components/feedback-report-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FeedbackPage() {
  return (
    <div className="container max-w-2xl py-6 sm:py-8">
      <Card>
        <CardHeader>
          <CardTitle>{"\u8cea\u554f\u30fb\u4e0d\u5177\u5408\u5831\u544a"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">
            {"\u30d0\u30b0\u3001\u8cea\u554f\u3001\u6539\u5584\u8981\u671b\u306a\u3069\u3092\u9001\u308c\u307e\u3059\u3002\u30ed\u30b0\u30a4\u30f3\u3057\u3066\u3044\u306a\u304f\u3066\u3082\u9001\u4fe1\u3067\u304d\u307e\u3059\u3002"}
          </p>
          <FeedbackReportForm />
        </CardContent>
      </Card>
    </div>
  );
}
