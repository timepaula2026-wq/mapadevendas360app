import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Training, ContentItem } from "@/types/training";

interface TrainingStore {
  trainings: Training[];
  addTraining: (training: Omit<Training, "id" | "createdAt" | "progress">) => void;
  removeTraining: (id: string) => void;
  addContent: (trainingId: string, content: Omit<ContentItem, "id">) => void;
  removeContent: (trainingId: string, contentId: string) => void;
  toggleContentComplete: (trainingId: string, contentId: string) => void;
}

export const useTrainingStore = create<TrainingStore>()(
  persist(
    (set) => ({
      trainings: [
        {
          id: "demo-1",
          title: "Introdução ao React",
          description: "Aprenda os fundamentos do React do zero ao avançado.",
          category: "Desenvolvimento",
          contents: [
            { id: "c1", type: "youtube", title: "React em 1 hora", youtubeId: "dQw4w9WgXcQ", duration: "1:02:30", completed: false },
            { id: "c2", type: "pdf", title: "Guia de Hooks.pdf", fileSize: "2.4 MB", completed: false },
            { id: "c3", type: "youtube", title: "Estado e Props", youtubeId: "dQw4w9WgXcQ", duration: "45:12", completed: true },
          ],
          progress: 33,
          createdAt: new Date().toISOString(),
        },
        {
          id: "demo-2",
          title: "Design UI/UX",
          description: "Domine os princípios de design para criar interfaces incríveis.",
          category: "Design",
          contents: [
            { id: "c4", type: "youtube", title: "Fundamentos de UI", youtubeId: "dQw4w9WgXcQ", duration: "32:00", completed: false },
            { id: "c5", type: "file", title: "Templates Figma.zip", fileSize: "15 MB", completed: false },
          ],
          progress: 0,
          createdAt: new Date().toISOString(),
        },
      ],
      addTraining: (training) =>
        set((state) => ({
          trainings: [
            ...state.trainings,
            {
              ...training,
              id: crypto.randomUUID(),
              progress: 0,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      removeTraining: (id) =>
        set((state) => ({
          trainings: state.trainings.filter((t) => t.id !== id),
        })),
      addContent: (trainingId, content) =>
        set((state) => ({
          trainings: state.trainings.map((t) =>
            t.id === trainingId
              ? { ...t, contents: [...t.contents, { ...content, id: crypto.randomUUID() }] }
              : t
          ),
        })),
      removeContent: (trainingId, contentId) =>
        set((state) => ({
          trainings: state.trainings.map((t) =>
            t.id === trainingId
              ? { ...t, contents: t.contents.filter((c) => c.id !== contentId) }
              : t
          ),
        })),
      toggleContentComplete: (trainingId, contentId) =>
        set((state) => ({
          trainings: state.trainings.map((t) => {
            if (t.id !== trainingId) return t;
            const contents = t.contents.map((c) =>
              c.id === contentId ? { ...c, completed: !c.completed } : c
            );
            const completed = contents.filter((c) => c.completed).length;
            const progress = contents.length > 0 ? Math.round((completed / contents.length) * 100) : 0;
            return { ...t, contents, progress };
          }),
        })),
    }),
    { name: "training-storage" }
  )
);
