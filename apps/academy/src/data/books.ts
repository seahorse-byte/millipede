export const BOOK_TITLES: Record<number, string> = {
  0: "Foundations",
  1: "Runtimes & Languages",
  2: "Event-Driven Architecture",
  3: "Security & Privacy",
  4: "Stage 1 — Pipeline Skeleton",
  5: "Stages 2+3 — Security + AI",
  6: "Stage 4 — SolidJS Frontend",
  7: "Stage 5 + EM Leadership",
};

export function bookLabel(book: number): string {
  return `Book ${book} — ${BOOK_TITLES[book] ?? "Coming soon"}`;
}

export function groupLessonsByBook<T extends { data: { book: number; id: string } }>(
  lessons: T[],
): Map<number, T[]> {
  const sorted = [...lessons].sort((a, b) =>
    a.data.id.localeCompare(b.data.id, undefined, { numeric: true }),
  );
  const map = new Map<number, T[]>();
  for (const lesson of sorted) {
    const list = map.get(lesson.data.book) ?? [];
    list.push(lesson);
    map.set(lesson.data.book, list);
  }
  return map;
}
