import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const { password } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/ideas");

  return (
    <div className="container grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 py-10 md:grid-cols-[1fr_420px]">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-normal">アイデアを投稿して、反応を集める。</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Supabase Auth を使った登録・ログインです。ログイン後に投稿、コメント、いいね、実行報告ができます。
        </p>
      </div>
      <LoginForm message={password === "updated" ? "パスワードを更新しました。新しいパスワードでログインしてください。" : undefined} />
    </div>
  );
}
