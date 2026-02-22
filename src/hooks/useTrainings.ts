import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ContentItem {
  id: string;
  type: "youtube" | "pdf" | "file";
  title: string;
  url?: string;
  youtubeId?: string;
  duration?: string;
  fileSize?: string;
  completed: boolean;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  contents: ContentItem[];
  progress: number;
  createdAt: string;
}

export const useTrainings = () => {
  const { user } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrainings = useCallback(async () => {
    if (!user) { setTrainings([]); setLoading(false); return; }

    const { data: trainingsData } = await supabase
      .from("trainings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!trainingsData) { setLoading(false); return; }

    const { data: contentsData } = await supabase
      .from("content_items")
      .select("*")
      .eq("user_id", user.id);

    const contents = contentsData || [];

    const mapped: Training[] = trainingsData.map((t: any) => {
      const tContents = contents
        .filter((c: any) => c.training_id === t.id)
        .map((c: any): ContentItem => ({
          id: c.id,
          type: c.type as ContentItem["type"],
          title: c.title,
          url: c.url || undefined,
          youtubeId: c.youtube_id || undefined,
          duration: c.duration || undefined,
          fileSize: c.file_size || undefined,
          completed: c.completed || false,
        }));

      return {
        id: t.id,
        title: t.title,
        description: t.description || "",
        category: t.category || "Geral",
        thumbnail: t.thumbnail || undefined,
        contents: tContents,
        progress: t.progress || 0,
        createdAt: t.created_at,
      };
    });

    setTrainings(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTrainings(); }, [fetchTrainings]);

  const addTraining = async (data: { title: string; description: string; category: string }) => {
    if (!user) return;
    await supabase.from("trainings").insert({
      user_id: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
    });
    await fetchTrainings();
  };

  const removeTraining = async (id: string) => {
    await supabase.from("trainings").delete().eq("id", id);
    await fetchTrainings();
  };

  const addContent = async (trainingId: string, content: Omit<ContentItem, "id">) => {
    if (!user) return;
    await supabase.from("content_items").insert({
      training_id: trainingId,
      user_id: user.id,
      type: content.type,
      title: content.title,
      url: content.url || null,
      youtube_id: content.youtubeId || null,
      duration: content.duration || null,
      file_size: content.fileSize || null,
      completed: content.completed || false,
    });
    await recalcProgress(trainingId);
    await fetchTrainings();
  };

  const removeContent = async (trainingId: string, contentId: string) => {
    await supabase.from("content_items").delete().eq("id", contentId);
    await recalcProgress(trainingId);
    await fetchTrainings();
  };

  const toggleContentComplete = async (trainingId: string, contentId: string) => {
    const training = trainings.find(t => t.id === trainingId);
    const content = training?.contents.find(c => c.id === contentId);
    if (!content) return;
    await supabase.from("content_items").update({ completed: !content.completed }).eq("id", contentId);
    await recalcProgress(trainingId);
    await fetchTrainings();
  };

  const recalcProgress = async (trainingId: string) => {
    const { data } = await supabase
      .from("content_items")
      .select("completed")
      .eq("training_id", trainingId);
    if (!data || data.length === 0) {
      await supabase.from("trainings").update({ progress: 0 }).eq("id", trainingId);
      return;
    }
    const completed = data.filter((c: any) => c.completed).length;
    const progress = Math.round((completed / data.length) * 100);
    await supabase.from("trainings").update({ progress }).eq("id", trainingId);
  };

  return { trainings, loading, addTraining, removeTraining, addContent, removeContent, toggleContentComplete, refetch: fetchTrainings };
};
