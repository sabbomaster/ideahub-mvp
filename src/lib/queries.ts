import type { IdeaStatus, IdeaVisibility } from "@/lib/database.types";
import type { IdeaCardData } from "@/components/idea-card";

const defaultIdeaListLimit = 30;
const fallbackDate = new Date(0).toISOString();

export type IdeaSortColumn = "created_at" | "title" | "updated_at";

export type SupabaseLikeClient = {
  from: (table: string) => {
    select: (columns: string) => QueryBuilder;
  };
  storage?: {
    from: (bucket: string) => {
      createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null; error: unknown }>;
    };
  };
};

type QueryBuilder = {
  eq: (column: string, value: unknown) => QueryBuilder;
  in: (column: string, values: string[]) => QueryBuilder;
  is: (column: string, value: null) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  not: (column: string, operator: string, value: unknown) => QueryBuilder;
  order: (column: string, options: { ascending: boolean }) => QueryBuilder;
  range: (from: number, to: number) => QueryBuilder;
  then: PromiseLike<{ data: unknown[] | null }>["then"];
};

type ProfileLite = { id: string; username: string | null; display_name: string | null };

function normalizeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return fallbackDate;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallbackDate : value;
}

function normalizeProfile(profile: unknown, fallbackUserId: string): ProfileLite | null {
  const value = Array.isArray(profile) ? profile[0] : profile;
  if (!value || typeof value !== "object") return fallbackUserId ? { id: fallbackUserId, username: null, display_name: null } : null;
  const record = value as Record<string, unknown>;
  return {
    id: normalizeText(record.id, fallbackUserId),
    username: typeof record.username === "string" ? record.username : null,
    display_name: typeof record.display_name === "string" ? record.display_name : null,
  };
}

function normalizeImagePaths(imageUrls: unknown, fallbackImageUrl?: unknown) {
  const paths = Array.isArray(imageUrls) ? imageUrls : [];
  return [...new Set([...paths, fallbackImageUrl].filter((path): path is string => typeof path === "string" && path.length > 0))].slice(0, 4);
}

async function signIdeaImageUrls(supabase: SupabaseLikeClient, imageUrls: string[] | null | undefined, fallbackImageUrl?: string | null) {
  const uniquePaths = normalizeImagePaths(imageUrls, fallbackImageUrl);

  if (!uniquePaths.length || !supabase.storage) return [];

  const signedUrls = await Promise.all(
    uniquePaths.map(async (path) => {
      try {
        const { data, error } = await supabase.storage!.from("idea-images").createSignedUrl(path, 60 * 60);
        if (error) {
          console.error("[getIdeaCards] failed to sign idea image", { error, path });
          return null;
        }
        return data?.signedUrl ?? null;
      } catch (error) {
        console.error("[getIdeaCards] failed to sign idea image", { error, path });
        return null;
      }
    }),
  );

  return signedUrls.filter((url): url is string => Boolean(url));
}

function countBy<T extends Record<string, unknown>>(rows: T[] | null | undefined, key: keyof T) {
  const counts = new Map<string, number>();
  rows?.forEach((row) => {
    const value = row[key];
    if (typeof value === "string" && value) counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return counts;
}

export async function getIdeaCards(
  supabase: SupabaseLikeClient,
  options: {
    ids?: string[];
    includeNonPublic?: boolean;
    limit?: number;
    orderBy?: IdeaSortColumn;
    orderAscending?: boolean;
    range?: { from: number; to: number };
    status?: IdeaStatus;
    userId?: string;
    visibility?: IdeaVisibility;
  } = {},
): Promise<IdeaCardData[]> {
  if (options.ids && !options.ids.length) return [];

  let query = supabase
    .from("ideas")
    .select("id,title,body,type,status,source,visibility,execution_permission,image_url,image_urls,created_at,updated_at,user_id,profiles(id,username,display_name)")
    .order(options.orderBy ?? "created_at", { ascending: options.orderAscending ?? false });

  if (options.status) {
    query = query.eq("status", options.status);
  } else if (!options.includeNonPublic) {
    query = query.eq("status", "active");
  }
  if (options.range) {
    query = query.range(options.range.from, options.range.to);
  } else if (options.limit || !options.ids) {
    query = query.limit(options.limit ?? defaultIdeaListLimit);
  }
  if (options.userId) query = query.eq("user_id", options.userId);
  if (options.ids) query = query.in("id", options.ids);
  if (options.visibility) query = query.eq("visibility", options.visibility);

  const { data: ideas } = await query;
  const typedIdeas = ((ideas ?? []) as Array<Record<string, unknown>>).map((idea) => {
    const userId = normalizeText(idea.user_id);
    return {
      id: normalizeText(idea.id),
      user_id: userId,
      title: normalizeText(idea.title, "無題"),
      body: normalizeText(idea.body),
      type: idea.type === "serious" ? "serious" : "rough",
      status: idea.status === "completed" || idea.status === "archived" ? idea.status : "active",
      status_before_archive: idea.status_before_archive === "completed" || idea.status_before_archive === "active" ? idea.status_before_archive : null,
      source: idea.source === "mental_seesaw" ? "mental_seesaw" : "manual",
      visibility: idea.visibility === "private" ? "private" : "public",
      execution_permission: idea.execution_permission === "owner_only" ? "owner_only" : "public",
      image_url: typeof idea.image_url === "string" ? idea.image_url : null,
      image_urls: normalizeImagePaths(idea.image_urls, idea.image_url),
      created_at: normalizeDate(idea.created_at),
      updated_at: normalizeDate(idea.updated_at),
      profiles: normalizeProfile(idea.profiles, userId),
    } satisfies Omit<IdeaCardData, "likes" | "comments" | "executions">;
  }).filter((idea) => Boolean(idea.id));
  const ideasWithImages = await Promise.all(
    typedIdeas.map(async (idea) => {
      const image_urls = await signIdeaImageUrls(supabase, idea.image_urls, idea.image_url);
      return { ...idea, image_url: image_urls[0] ?? null, image_urls };
    }),
  );
  const ids = ideasWithImages.map((idea) => idea.id);

  if (!ids.length) return [];

  const [{ data: likes }, { data: comments }, { data: executions }] = await Promise.all([
    supabase.from("likes").select("target_id").eq("target_type", "idea").in("target_id", ids),
    supabase.from("comments").select("idea_id").in("idea_id", ids),
    supabase.from("executions").select("idea_id").in("idea_id", ids),
  ]);

  const likeCounts = countBy((likes ?? []) as { target_id: string }[], "target_id");
  const commentCounts = countBy((comments ?? []) as { idea_id: string }[], "idea_id");
  const executionCounts = countBy((executions ?? []) as { idea_id: string }[], "idea_id");

  return ideasWithImages.map((idea) => ({
    ...idea,
    likes: [{ count: likeCounts.get(idea.id) ?? 0 }],
    comments: [{ count: commentCounts.get(idea.id) ?? 0 }],
    executions: [{ count: executionCounts.get(idea.id) ?? 0 }],
  }));
}

export async function getMyExecutedIdeaCards(
  supabase: SupabaseLikeClient,
  userId: string,
  limit = defaultIdeaListLimit,
): Promise<IdeaCardData[]> {
  const [ownCompleted, executionRows] = await Promise.all([
    getIdeaCards(supabase, { limit, status: "completed", userId }),
    supabase.from("executions").select("idea_id").eq("user_id", userId).limit(limit),
  ]);
  const executionIdeaIds = ((executionRows.data ?? []) as { idea_id?: unknown }[])
    .map((row) => row.idea_id)
    .filter((ideaId): ideaId is string => typeof ideaId === "string" && Boolean(ideaId));
  const reportedIdeas = await getIdeaCards(supabase, { ids: executionIdeaIds.slice(0, limit), includeNonPublic: true });
  const merged = new Map<string, IdeaCardData>();

  [...ownCompleted, ...reportedIdeas].forEach((idea) => {
    if (idea.status !== "archived") {
      merged.set(idea.id, idea);
    }
  });

  return [...merged.values()]
    .sort((a, b) => Date.parse(b.updated_at ?? "") - Date.parse(a.updated_at ?? ""))
    .slice(0, limit);
}
