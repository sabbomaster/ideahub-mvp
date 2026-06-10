import { UpdatePasswordForm } from "@/components/update-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] max-w-xl items-center py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>新しいパスワードを設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">
            メール内のリンクから開いた状態で、新しいパスワードを入力してください。
          </p>
          <UpdatePasswordForm error={error} />
        </CardContent>
      </Card>
    </div>
  );
}
