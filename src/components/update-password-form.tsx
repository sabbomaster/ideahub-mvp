import Link from "next/link";
import { updatePassword } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const errorMessages: Record<string, string> = {
  mismatch: "確認用パスワードが一致しません。",
  session: "再設定リンクの有効期限が切れている可能性があります。もう一度メール送信からやり直してください。",
  short: "パスワードは6文字以上で入力してください。",
  update: "パスワードの更新に失敗しました。もう一度メール送信からやり直してください。",
};

export function UpdatePasswordForm({ error }: { error?: string }) {
  return (
    <form action={updatePassword} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          新しいパスワード
        </label>
        <Input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" />
      </div>
      <div className="space-y-2">
        <label htmlFor="password_confirm" className="text-sm font-medium">
          新しいパスワードをもう一度
        </label>
        <Input id="password_confirm" name="password_confirm" type="password" required minLength={6} autoComplete="new-password" />
      </div>
      {error && errorMessages[error] ? <p className="text-sm leading-6 text-destructive">{errorMessages[error]}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" className="w-full sm:w-auto">
          パスワードを更新
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/login">ログイン画面へ</Link>
        </Button>
      </div>
    </form>
  );
}
