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
    <div className="container grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 py-10 md:grid-cols-[1fr_420px]">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-normal">{"\u30a2\u30a4\u30c7\u30a2\u3092\u6295\u7a3f\u3057\u3066\u3001\u53cd\u5fdc\u3092\u96c6\u3081\u308b\u3002"}</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          {"\u516c\u958b\u30c6\u30b9\u30c8\u4e2d\u306e\u8352\u3089\u3057\u5bfe\u7b56\u3068\u4e0d\u6b63\u30a2\u30ab\u30a6\u30f3\u30c8\u5bfe\u7b56\u306e\u305f\u3081\u3001\u73fe\u5728\u306fGoogle\u30ed\u30b0\u30a4\u30f3\u306e\u307f\u5bfe\u5fdc\u3057\u3066\u3044\u307e\u3059\u3002"}
        </p>
      </div>
      <LoginForm message={error === "auth" ? "Googleログインに失敗しました。もう一度お試しください。" : undefined} />
    </div>
  );
}
