import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/ideas");

  return (
    <div className="container grid min-h-[calc(100vh-8rem)] max-w-5xl items-center gap-8 py-10 md:grid-cols-[1fr_420px]">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-normal">アイデアを投稿して、反応を集める。</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          公開テスト中の荒らし対策と不正アカウント対策のため、現在はGoogleログインのみ対応しています。
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          ログインすると、
          <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
            プライバシーポリシー
          </Link>
          と
          <Link href="/terms" className="font-medium text-primary underline-offset-4 hover:underline">
            利用規約
          </Link>
          に同意したものとみなします。
        </p>
      </div>
      <LoginForm message={error === "auth" ? "Googleログインに失敗しました。もう一度お試しください。" : undefined} />
    </div>
  );
}
