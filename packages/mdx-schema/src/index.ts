import { z } from "zod";

export const lessonTypes = [
  "lesson",
  "deep-dive",
  "interactive",
  "lab",
  "quiz",
  "recap",
  "instructor",
] as const;

export type LessonType = (typeof lessonTypes)[number];

export const lessonFrontmatterSchema = z.object({
  id: z.string().regex(/^\d+\.\d+([A-Z]\d+)?$/),
  book: z.number().int().min(0).max(7),
  title: z.string().min(1),
  type: z.enum(lessonTypes).default("lesson"),
  duration_min: z.number().int().positive().optional(),
  prerequisites: z.array(z.string()).default([]),
  objectives: z.array(z.string()).default([]),
  components: z.array(z.string()).default([]),
  quiz_id: z.string().optional(),
  lab_id: z.string().optional(),
  instructor_notes: z.boolean().default(false),
});

export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;

export function parseLessonFrontmatter(data: unknown): LessonFrontmatter {
  return lessonFrontmatterSchema.parse(data);
}

export const widgetNames = [
  "BitRegister",
  "PacketJourney",
  "EventLoopSimulator",
  "OwnershipVisualizer",
  "BorrowCheckerPanel",
  "ConcurrencyChannels",
  "WasmBoundary",
  "KafkaPipelineVisualizer",
  "mTLSHandshake",
  "WasmRedaction",
  "AgentEvalGate",
  "ApiWorkerSplit",
  "BffProxyFlow",
] as const;

export type WidgetName = (typeof widgetNames)[number];

export const pageTypeDescriptions: Record<LessonType, string> = {
  lesson: "Core teaching + inline widgets",
  "deep-dive": "Optional 60-min rabbit hole (e.g. 3.11 BFF)",
  interactive: "Animation-first canvas",
  lab: "Hands-on exercise with verification",
  quiz: "5–10 questions, scored",
  recap: "Flashcards, teach-it-back",
  instructor: "Timing, talking points, rubric",
};
