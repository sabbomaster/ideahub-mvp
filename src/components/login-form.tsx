"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ message: initialMessage = "" }: { message?: string }) {
  const supabase = createClient();
  const [message, setMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error(error);
      setLoading(false);
      setMessage("\u30ed\u30b0\u30a4\u30f3\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u6642\u9593\u3092\u7f6e\u3044\u3066\u3082\u3046\u4e00\u5ea6\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"\u30ed\u30b0\u30a4\u30f3"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">
          {"\u30a2\u30a4\u30c7\u30a2\u30cf\u30d6\u3067\u306f\u4e0d\u6b63\u30a2\u30ab\u30a6\u30f3\u30c8\u5bfe\u7b56\u306e\u305f\u3081\u3001\u73fe\u5728\u306fGoogle\u30ed\u30b0\u30a4\u30f3\u306e\u307f\u5bfe\u5fdc\u3057\u3066\u3044\u307e\u3059\u3002"}
        </p>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button type="button" onClick={handleGoogleLogin} disabled={loading} className="min-h-11 w-full">
          {loading ? "Google\u3078\u79fb\u52d5\u4e2d..." : "Google\u3067\u30ed\u30b0\u30a4\u30f3"}
        </Button>
      </CardContent>
    </Card>
  );
}
