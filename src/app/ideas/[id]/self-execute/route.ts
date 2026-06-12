import { NextResponse, type NextRequest } from "next/server";
import { ensureProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

function redirectToIdea(request: NextRequest, ideaId: string, error?: string) {
  const url = new URL(`/ideas/${ideaId}`, request.url);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  await ensureProfile(supabase, user);

  const { data: idea, error: ideaError } = await supabase
    .from("ideas")
    .select("user_id")
    .eq("id", id)
    .single();

  if (ideaError || !idea || (idea as { user_id: string }).user_id !== user.id) {
    if (ideaError) console.error(ideaError);
    return redirectToIdea(request, id, "execution");
  }

  const { error: updateError } = await supabase
    .from("ideas")
    .update({
      status: "completed",
      status_before_archive: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error(updateError);
    return redirectToIdea(request, id, "execution");
  }

  const { error: deleteError } = await supabase.from("executions").delete().eq("idea_id", id).eq("user_id", user.id);
  if (deleteError) {
    console.error(deleteError);
    return redirectToIdea(request, id, "execution");
  }

  const { error: insertError } = await supabase.from("executions").insert({
    idea_id: id,
    user_id: user.id,
    kind: "self",
    note: "自分で実行しました",
  });

  if (insertError) {
    console.error(insertError);
    return redirectToIdea(request, id, "execution");
  }

  return redirectToIdea(request, id);
}
