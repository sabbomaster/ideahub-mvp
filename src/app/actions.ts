"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";
import { hasExternalLink, isLowTrust, trustLimits } from "@/lib/trust";
import type { ExecutionPermission, IdeaStatus, IdeaType, IdeaVisibility, LikeTargetType, MentalSeesawItemKind, ReportTargetType } from "@/lib/database.types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfile(supabase, user);

  return { supabase, user };
}

async function getCreditScore(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("profiles").select("credit_score").eq("id", userId).single();
  return ((data as { credit_score?: number } | null)?.credit_score ?? 0);
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

const imageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

function getImageFiles(formData: FormData) {
  const files = [...formData.getAll("images"), ...formData.getAll("image")].filter((file): file is File => file instanceof File && file.size > 0);

  if (files.length > 4) {
    throw new Error("too_many_images");
  }

  return files;
}

async function uploadImageFile({
  bucket,
  file,
  maxSize,
  userId,
}: {
  bucket: "avatars" | "idea-images";
  file: File | null;
  maxSize: number;
  userId: string;
}) {
  if (!file || file.size === 0) return null;
  const extension = imageTypes.get(file.type);
  if (!extension || file.size > maxSize) {
    throw new Error("invalid_image");
  }

  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { supabase } = await requireUser();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error(error);
    throw new Error("upload_failed");
  }

  if (bucket === "avatars") {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  return path;
}

async function uploadIdeaImages(files: File[], userId: string) {
  const uploadedPaths: string[] = [];

  for (const file of files) {
    const path = await uploadImageFile({
      bucket: "idea-images",
      file,
      maxSize: 5 * 1024 * 1024,
      userId,
    });
    if (path) uploadedPaths.push(path);
  }

  return uploadedPaths;
}

function getUniqueImagePaths(imageUrls: string[] | null | undefined, fallbackImageUrl?: string | null) {
  return [...new Set([...(imageUrls ?? []), ...(fallbackImageUrl ? [fallbackImageUrl] : [])].filter(Boolean))].slice(0, 4);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createMentalSeesaw(formData: FormData) {
  const { supabase, user } = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const context = String(formData.get("context") ?? "").trim();

  if (!title) {
    redirect("/seesaws/new?error=missing");
  }

  const { data, error } = await supabase
    .from("mental_seesaws")
    .insert({
      user_id: user.id,
      title,
      description: context || null,
      context: context || null,
      is_public: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error(error);
    redirect("/seesaws/new?error=save");
  }

  revalidatePath("/seesaws");
  redirect(`/seesaws/${data.id}`);
}

export async function updateMentalSeesawMeta(seesawId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) {
    redirect(`/seesaws/${seesawId}?metaError=save`);
  }

  const { error } = await supabase
    .from("mental_seesaws")
    .update({
      title,
      description: description || null,
      context: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", seesawId)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    redirect(`/seesaws/${seesawId}?metaError=save`);
  }

  revalidatePath("/seesaws");
  revalidatePath(`/seesaws/${seesawId}`);
  redirect(`/seesaws/${seesawId}`);
}

export async function addMentalSeesawItem(seesawId: string, kind: MentalSeesawItemKind, formData: FormData) {
  const { supabase, user } = await requireUser();
  const content = String(formData.get("content") ?? "").trim();
  const reliefMethod = String(formData.get("relief_method") ?? "").trim();
  const weight = Number(formData.get("weight") ?? 1);

  if (!content || !["positive", "negative"].includes(kind) || !Number.isFinite(weight)) {
    redirect(`/seesaws/${seesawId}?error=item`);
  }

  const { data: seesaw } = await supabase.from("mental_seesaws").select("user_id").eq("id", seesawId).single();
  if (seesaw?.user_id !== user.id) {
    redirect(`/seesaws/${seesawId}`);
  }

  const { error } = await supabase.from("mental_seesaw_items").insert({
    seesaw_id: seesawId,
    user_id: user.id,
    kind,
    content,
    weight: Math.min(6, Math.max(1, Math.round(weight))),
    relief_method: kind === "negative" ? reliefMethod || null : null,
  });

  if (error) {
    console.error(error);
    redirect(`/seesaws/${seesawId}?error=item`);
  }

  revalidatePath(`/seesaws/${seesawId}`);
}

export async function updateMentalSeesawItem(seesawId: string, itemId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const content = String(formData.get("content") ?? "").trim();
  const reliefMethod = String(formData.get("relief_method") ?? "").trim();
  const weight = Number(formData.get("weight") ?? 1);

  if (!content || !Number.isFinite(weight)) {
    redirect(`/seesaws/${seesawId}?error=item`);
  }

  const { error } = await supabase
    .from("mental_seesaw_items")
    .update({
      content,
      weight: Math.min(6, Math.max(1, Math.round(weight))),
      relief_method: reliefMethod || null,
    })
    .eq("id", itemId)
    .eq("seesaw_id", seesawId)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    redirect(`/seesaws/${seesawId}?error=item`);
  }

  revalidatePath(`/seesaws/${seesawId}`);
}

export async function deleteMentalSeesawItem(seesawId: string, itemId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("mental_seesaw_items")
    .delete()
    .eq("id", itemId)
    .eq("seesaw_id", seesawId)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    redirect(`/seesaws/${seesawId}?error=item`);
  }

  revalidatePath(`/seesaws/${seesawId}`);
}

export async function publishMentalSeesawReliefIdea(seesawId: string, itemId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const reliefMethod = String(formData.get("relief_method") ?? "").trim();
  const { data: item, error: itemError } = await supabase
    .from("mental_seesaw_items")
    .select("id,content,relief_method,kind,seesaw_id")
    .eq("id", itemId)
    .eq("seesaw_id", seesawId)
    .single();

  if (itemError || !item) {
    console.error(itemError);
    redirect(`/seesaws/${seesawId}?error=publish`);
  }

  const { data: seesaw, error: seesawError } = await supabase
    .from("mental_seesaws")
    .select("id,title,user_id")
    .eq("id", item.seesaw_id)
    .single();

  if (seesawError || !seesaw) {
    console.error(seesawError);
    redirect(`/seesaws/${seesawId}?error=publish`);
  }

  if (item.kind !== "negative" || seesaw?.user_id !== user.id) {
    redirect(`/seesaws/${seesawId}`);
  }

  const proposal = reliefMethod || item.relief_method;
  if (!proposal) {
    redirect(`/seesaws/${seesawId}?error=publish`);
  }

  const { error } = await supabase.from("ideas").insert({
    user_id: user.id,
    title: `「${item.content}」への再提案`,
    body: [
      `メンタルシーソー「${seesaw.title}」からの投稿です。`,
      "",
      `ネガティブ項目: ${item.content}`,
      "",
      `再提案: ${proposal}`,
    ].join("\n"),
    type: "rough",
    source: "mental_seesaw",
    visibility: "private",
    execution_permission: "owner_only",
  });

  if (error) {
    console.error(error);
    redirect(`/seesaws/${seesawId}?error=publish`);
  }

  revalidatePath("/ideas");
  revalidatePath(`/seesaws/${seesawId}`);
  redirect("/ideas");
}

export async function updateMentalSeesawOutcome(seesawId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const finalDecision = String(formData.get("final_decision") ?? "").trim();
  const nextAction = String(formData.get("next_action") ?? "").trim();

  const { error } = await supabase
    .from("mental_seesaws")
    .update({
      final_decision: finalDecision || null,
      next_action: nextAction || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", seesawId)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    redirect(`/seesaws/${seesawId}?error=outcome`);
  }

  revalidatePath(`/seesaws/${seesawId}`);
}

export async function addSelfQuestionMemo(seesawId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    redirect(`/seesaws/${seesawId}?error=memo`);
  }

  const { data: seesaw } = await supabase.from("mental_seesaws").select("user_id").eq("id", seesawId).single();
  if (seesaw?.user_id !== user.id) {
    redirect(`/seesaws/${seesawId}`);
  }

  const { error } = await supabase.from("mental_seesaw_suggestions").insert({
    seesaw_id: seesawId,
    user_id: user.id,
    body,
  });

  if (error) {
    console.error(error);
    redirect(`/seesaws/${seesawId}?error=memo`);
  }

  revalidatePath(`/seesaws/${seesawId}`);
}

export async function updateSelfQuestionMemo(seesawId: string, memoId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    redirect(`/seesaws/${seesawId}?error=memo`);
  }

  const { error } = await supabase
    .from("mental_seesaw_suggestions")
    .update({ body })
    .eq("id", memoId)
    .eq("seesaw_id", seesawId)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    redirect(`/seesaws/${seesawId}?error=memo`);
  }

  revalidatePath(`/seesaws/${seesawId}`);
}

export async function deleteSelfQuestionMemo(seesawId: string, memoId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("mental_seesaw_suggestions")
    .delete()
    .eq("id", memoId)
    .eq("seesaw_id", seesawId)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    redirect(`/seesaws/${seesawId}?error=memo`);
  }

  revalidatePath(`/seesaws/${seesawId}`);
}

export async function createIdea(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfile(supabase, user);

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const type = String(formData.get("type") ?? "rough") as IdeaType;
  const visibility = String(formData.get("visibility") ?? "public") as IdeaVisibility;
  const executionPermission = String(formData.get("execution_permission") ?? "public") as ExecutionPermission;
  const normalizedExecutionPermission = visibility === "private" ? "owner_only" : executionPermission;
  let imageFiles: File[] = [];

  if (!title || !body || !["rough", "serious"].includes(type) || !["public", "private"].includes(visibility) || !["owner_only", "public"].includes(executionPermission)) {
    redirect("/ideas/new?error=missing");
  }

  try {
    imageFiles = getImageFiles(formData);
  } catch (imageError) {
    console.error(imageError);
    redirect("/ideas/new?error=image");
  }

  const creditScore = await getCreditScore(supabase, user.id);
  if (type === "serious" && creditScore < trustLimits.seriousIdeaMinScore) {
    redirect("/ideas/new?error=serious_trust");
  }
  if (isLowTrust(creditScore) && hasExternalLink(`${title}\n${body}`)) {
    redirect("/ideas/new?error=external_link");
  }

  const [{ count: dailyIdeaCount }, { count: recentIdeaCount }] = await Promise.all([
    supabase
      .from("ideas")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", minutesAgo(24 * 60)),
    supabase
      .from("ideas")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", minutesAgo(10)),
  ]);

  if (isLowTrust(creditScore) && (dailyIdeaCount ?? 0) >= trustLimits.dailyIdeaLimit) {
    redirect("/ideas/new?error=daily_limit");
  }
  if (isLowTrust(creditScore) && (recentIdeaCount ?? 0) >= trustLimits.recentIdeaLimit) {
    redirect("/ideas/new?error=recent_limit");
  }

  let imageUrls: string[] = [];
  try {
    imageUrls = await uploadIdeaImages(imageFiles, user.id);
  } catch (uploadError) {
    console.error(uploadError);
    redirect("/ideas/new?error=image");
  }

  const { error } = await supabase.from("ideas").insert({
    title,
    body,
    type,
    visibility,
    execution_permission: normalizedExecutionPermission,
    image_url: imageUrls[0] ?? null,
    image_urls: imageUrls,
    user_id: user.id,
  });

  if (error) {
    console.error(error);
    redirect("/ideas/new?error=save");
  }

  revalidatePath("/ideas");
  if (visibility === "public") {
    revalidatePath("/feed");
  }
  redirect("/ideas");
}

export async function updateIdea(ideaId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const type = String(formData.get("type") ?? "rough") as IdeaType;
  const visibility = String(formData.get("visibility") ?? "public") as IdeaVisibility;
  const executionPermission = String(formData.get("execution_permission") ?? "public") as ExecutionPermission;
  const normalizedExecutionPermission = visibility === "private" ? "owner_only" : executionPermission;
  const removeImageUrls = new Set(formData.getAll("remove_image_urls").map((value) => String(value)));
  let imageFiles: File[] = [];

  if (!title || !body || !["rough", "serious"].includes(type) || !["public", "private"].includes(visibility) || !["owner_only", "public"].includes(executionPermission)) {
    redirect(`/ideas/${ideaId}/edit?error=missing`);
  }

  try {
    imageFiles = getImageFiles(formData);
  } catch (uploadError) {
    console.error(uploadError);
    redirect(`/ideas/${ideaId}/edit?error=image`);
  }

  const { data: existingIdea, error: existingIdeaError } = await supabase
    .from("ideas")
    .select("image_url,image_urls")
    .eq("id", ideaId)
    .eq("user_id", user.id)
    .single();

  if (existingIdeaError || !existingIdea) {
    console.error(existingIdeaError);
    redirect(`/ideas/${ideaId}/edit?error=save`);
  }

  const existingImagePaths = getUniqueImagePaths(
    (existingIdea as { image_urls?: string[] | null }).image_urls,
    (existingIdea as { image_url?: string | null }).image_url,
  );
  const keptImagePaths = existingImagePaths.filter((path) => !removeImageUrls.has(path));

  if (keptImagePaths.length + imageFiles.length > 4) {
    redirect(`/ideas/${ideaId}/edit?error=image`);
  }

  let imageUrls: string[] = [];
  try {
    imageUrls = await uploadIdeaImages(imageFiles, user.id);
  } catch (uploadError) {
    console.error(uploadError);
    redirect(`/ideas/${ideaId}/edit?error=image`);
  }

  const nextImageUrls = [...keptImagePaths, ...imageUrls].slice(0, 4);

  const updates: {
    body: string;
    execution_permission: ExecutionPermission;
    image_url: string | null;
    image_urls: string[];
    title: string;
    type: IdeaType;
    updated_at: string;
    visibility: IdeaVisibility;
  } = {
    title,
    body,
    type,
    visibility,
    execution_permission: normalizedExecutionPermission,
    image_url: nextImageUrls[0] ?? null,
    image_urls: nextImageUrls,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("ideas")
    .update(updates)
    .eq("id", ideaId)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    redirect(`/ideas/${ideaId}/edit?error=save`);
  }

  const removedPaths = existingImagePaths.filter((path) => removeImageUrls.has(path) && path.startsWith(`${user.id}/`));
  if (removedPaths.length) {
    const { error: removeError } = await supabase.storage.from("idea-images").remove(removedPaths);
    if (removeError) console.error(removeError);
  }

  revalidatePath("/ideas");
  revalidatePath("/feed");
  revalidatePath(`/ideas/${ideaId}`);
  revalidatePath(`/ideas/${ideaId}/edit`);
  redirect(`/ideas/${ideaId}`);
}

export async function updateIdeaStatus(ideaId: string, status: IdeaStatus) {
  const { supabase, user } = await requireUser();
  if (!["active", "completed", "archived"].includes(status)) {
    redirect(`/ideas/${ideaId}?error=status`);
  }

  const { error } = await supabase
    .from("ideas")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ideaId)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    redirect(`/ideas/${ideaId}?error=status`);
  }

  if (status === "active") {
    await supabase.from("executions").delete().eq("idea_id", ideaId).eq("user_id", user.id).eq("kind", "self");
  }

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${ideaId}`);
  redirect(`/ideas/${ideaId}`);
}

export async function archiveIdea(ideaId: string) {
  const { supabase, user } = await requireUser();
  const { data: idea } = await supabase
    .from("ideas")
    .select("status")
    .eq("id", ideaId)
    .eq("user_id", user.id)
    .single();
  const previousStatus = ((idea as { status?: IdeaStatus } | null)?.status === "completed" ? "completed" : "active");

  const { error } = await supabase
    .from("ideas")
    .update({
      status: "archived",
      status_before_archive: previousStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ideaId)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    redirect(`/ideas/${ideaId}?error=archive`);
  }

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${ideaId}`);
  redirect(`/ideas/${ideaId}`);
}

export async function unarchiveIdea(ideaId: string) {
  const { supabase, user } = await requireUser();
  const { data: idea } = await supabase
    .from("ideas")
    .select("status_before_archive")
    .eq("id", ideaId)
    .eq("user_id", user.id)
    .single();
  const restoredStatus = ((idea as { status_before_archive?: "active" | "completed" | null } | null)?.status_before_archive ?? "active");

  const { error } = await supabase
    .from("ideas")
    .update({
      status: restoredStatus,
      status_before_archive: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ideaId)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    redirect(`/ideas/${ideaId}?error=archive`);
  }

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${ideaId}`);
  redirect(`/ideas/${ideaId}`);
}

export async function deleteArchivedIdea(ideaId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("ideas")
    .delete()
    .eq("id", ideaId)
    .eq("user_id", user.id)
    .eq("status", "archived");

  if (error) {
    console.error(error);
    redirect(`/ideas/${ideaId}?error=delete`);
  }

  revalidatePath("/ideas");
  redirect("/ideas?box=archived");
}

export async function addComment(ideaId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    redirect(`/ideas/${ideaId}?error=comment`);
  }

  const creditScore = await getCreditScore(supabase, user.id);
  if (isLowTrust(creditScore)) {
    const { count: recentCommentCount } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", minutesAgo(10));

    if ((recentCommentCount ?? 0) >= trustLimits.commentWindowLimit) {
      redirect(`/ideas/${ideaId}?error=comment_rate`);
    }
  }

  await supabase.from("comments").insert({ idea_id: ideaId, user_id: user.id, body });
  revalidatePath(`/ideas/${ideaId}`);
}

export async function toggleLike(targetType: LikeTargetType, targetId: string, returnPath: string) {
  const { supabase, user } = await requireUser();
  const existing = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing.data) {
    await supabase.from("likes").delete().eq("id", existing.data.id);
  } else {
    await supabase.from("likes").insert({ user_id: user.id, target_type: targetType, target_id: targetId });
  }

  revalidatePath(returnPath);
}

export async function selfExecuteIdea(ideaId: string) {
  const { supabase, user } = await requireUser();
  const { data: idea } = await supabase
    .from("ideas")
    .select("user_id,status")
    .eq("id", ideaId)
    .single();

  if (!idea || (idea as { user_id: string }).user_id !== user.id) {
    redirect(`/ideas/${ideaId}?error=execution`);
  }

  await supabase
    .from("ideas")
    .update({
      status: "completed",
      status_before_archive: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ideaId)
    .eq("user_id", user.id);

  await supabase.from("executions").delete().eq("idea_id", ideaId).eq("user_id", user.id);
  await supabase.from("executions").insert({ idea_id: ideaId, user_id: user.id, kind: "self", note: "自分で実行しました" });

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${ideaId}`);
  redirect(`/ideas/${ideaId}`);
}

export async function markExecutionReport(ideaId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const { data: idea } = await supabase
    .from("ideas")
    .select("user_id,source,visibility,execution_permission")
    .eq("id", ideaId)
    .single();

  if (!idea) {
    redirect(`/ideas/${ideaId}?error=execution`);
  }
  const typedIdea = idea as { execution_permission?: ExecutionPermission; source?: string; user_id: string; visibility?: IdeaVisibility };
  if (typedIdea.user_id === user.id || typedIdea.visibility !== "public" || typedIdea.source === "mental_seesaw" || typedIdea.execution_permission !== "public") {
    redirect(`/ideas/${ideaId}?error=execution`);
  }

  const note = String(formData.get("note") ?? "").trim() || null;
  await supabase.from("executions").delete().eq("idea_id", ideaId).eq("user_id", user.id);
  await supabase.from("executions").insert({ idea_id: ideaId, user_id: user.id, kind: "report", note });
  revalidatePath(`/ideas/${ideaId}`);
}

export async function markExecuted(ideaId: string, formData: FormData) {
  return markExecutionReport(ideaId, formData);
}

export async function reportTarget(
  targetType: ReportTargetType,
  targetId: string,
  returnPath: string,
  formData: FormData,
) {
  const { supabase, user } = await requireUser();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!reason) {
    redirect(`${returnPath}?error=report`);
  }

  await supabase.from("reports").insert({ reporter_id: user.id, target_type: targetType, target_id: targetId, reason });
  revalidatePath(returnPath);
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const username = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarFile = formData.get("avatar");

  let avatarUrl: string | null = null;
  try {
    avatarUrl = await uploadImageFile({
      bucket: "avatars",
      file: avatarFile instanceof File ? avatarFile : null,
      maxSize: 2 * 1024 * 1024,
      userId: user.id,
    });
  } catch (uploadError) {
    console.error(uploadError);
    redirect(`/profiles/${user.id}?error=avatar`);
  }

  const updates: {
    avatar_url?: string;
    bio: string | null;
    display_name: string | null;
    username: string | null;
  } = {
    username: username || null,
    display_name: displayName || null,
    bio: bio || null,
  };

  if (avatarUrl) updates.avatar_url = avatarUrl;

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);

  if (error) {
    console.error(error);
    redirect(`/profiles/${user.id}?error=profile`);
  }

  revalidatePath(`/profiles/${user.id}`);
  redirect(`/profiles/${user.id}`);
}
