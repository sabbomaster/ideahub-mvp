import { redirect } from "next/navigation";
import { createMentalSeesaw } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";

export default async function NewMentalSeesawPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="container max-w-3xl py-6 sm:py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>メンタルシーソーを作成</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createMentalSeesaw} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                議題
              </label>
              <Input id="title" name="title" required placeholder="例: 今の仕事を続けるか、転職活動を始めるか" className="min-h-11" />
            </div>
            <div className="space-y-2">
              <label htmlFor="context" className="text-sm font-medium">
                説明文
              </label>
              <Textarea id="context" name="context" placeholder="何に迷っているか、どんな不安や期待があるかを書き出します。" className="min-h-36" />
            </div>
            <Button type="submit" className="min-h-11 w-full sm:w-auto">
              作成する
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
