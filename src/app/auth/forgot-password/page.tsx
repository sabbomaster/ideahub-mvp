import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] max-w-xl items-center py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>パスワードを再設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">
            登録したメールアドレスを入力してください。パスワード再設定用のメールを送信します。
          </p>
          <ForgotPasswordForm />
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">ログイン画面へ戻る</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
