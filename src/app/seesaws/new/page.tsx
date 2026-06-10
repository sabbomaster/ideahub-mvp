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
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>メンタルシーソーを作成</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createMentalSeesaw} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                議題
              </label>
              <Input id="title" name="title" required placeholder="例: 今の仕事を続けるか、転職活動を始めるか" />
            </div>
            <div className="space-y-2">
              <label htmlFor="context" className="text-sm font-medium">
                説明文
              </label>
              <Textarea id="context" name="context" placeholder="何に迷っているか、どんな不安や期待があるかを書き出します。" />
            </div>
            <Button type="submit">作成する</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
