import type { User } from "@supabase/supabase-js";

type ProfileQueryResult = PromiseLike<{ data: { id: string } | null; error: unknown }>;

type ProfileClient = {
  from: (table: "profiles") => {
    insert: (values: { display_name: string; id: string; username: string }) => {
      select: (columns: "id") => {
        single: () => ProfileQueryResult;
      };
    };
    select: (columns: "id") => {
      eq: (column: "id", value: string) => {
        maybeSingle: () => ProfileQueryResult;
      };
    };
  };
};

function buildProfileName(user: User) {
  const fallback = user.email?.split("@")[0] || "user";
  return {
    username: `${fallback.slice(0, 24)}-${user.id.slice(0, 8)}`,
    display_name: fallback,
  };
}

export async function ensureProfile(supabase: unknown, user: User) {
  const db = supabase as ProfileClient;
  const { data: profile, error: selectError } = await db
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error(selectError);
  }

  if (profile) {
    return profile;
  }

  const { username, display_name } = buildProfileName(user);
  const { data, error } = await db
    .from("profiles")
    .insert({
      id: user.id,
      username,
      display_name,
    })
    .select("id")
    .single();

  if (error) {
    console.error(error);
  }

  return data;
}
