import { redirect } from "next/navigation";
import { IdeasClient } from "@/components/ideas-client";
import { getIdeaCards, getMyExecutedIdeaCards } from "@/lib/queries";
import type { SupabaseLikeClient } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

type MyIdeaBox = "active" | "completed" | "archived";
type MyIdeaSort = "completed_first" | "created_asc" | "created_desc" | "title_asc" | "updated_desc";

const sortKeys: MyIdeaSort[] = ["completed_first", "created_asc", "created_desc", "title_asc", "updated_desc"];

function normalizeBox(box?: string): MyIdeaBox {
  return box === "completed" ? "completed" : box === "archived" ? "archived" : "active";
}

function normalizeSort(sort?: string): MyIdeaSort {
  return sortKeys.includes(sort as MyIdeaSort) ? (sort as MyIdeaSort) : "updated_desc";
}

export default async function IdeasPage({ searchParams }: { searchParams: Promise<{ box?: string; sort?: string }> }) {
  const { box, sort } = await searchParams;
  const currentBox = normalizeBox(box);
  const currentSort = normalizeSort(sort);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const ideaClient = supabase as unknown as SupabaseLikeClient;
  const [activeIdeas, completedIdeas, archivedIdeas, profileResult] = await Promise.all([
    getIdeaCards(ideaClient, { limit: 100, orderBy: "updated_at", status: "active", userId: user.id }),
    getMyExecutedIdeaCards(ideaClient, user.id, 100),
    getIdeaCards(ideaClient, { limit: 100, orderBy: "updated_at", status: "archived", userId: user.id }),
    supabase.from("profiles").select("id,username,display_name,credit_score").eq("id", user.id).single(),
  ]);
  const profile = profileResult.data as { credit_score?: number; display_name: string | null; id: string; username: string | null } | null;

  return (
    <IdeasClient
      currentBox={currentBox}
      currentSort={currentSort}
      currentUserId={user.id}
      currentUserProfile={profile ? { id: profile.id, username: profile.username, display_name: profile.display_name } : null}
      initialIdeasByBox={{
        active: activeIdeas,
        completed: completedIdeas,
        archived: archivedIdeas,
      }}
    />
  );
}
