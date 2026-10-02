import { notFound } from "next/navigation";
import { DIFFICULTIES, DIFFICULTY_META } from "@/lib/difficulty";
import type { Difficulty } from "@/lib/difficulty";
import { PuzzleScreen } from "@/components/PuzzleScreen";

type Params = { difficulty: string };

export function generateStaticParams(): Params[] {
  return DIFFICULTIES.map((d) => ({ difficulty: d }));
}

export async function generateMetadata({ params }: PageProps<"/[difficulty]">) {
  const { difficulty } = await params;
  if (!DIFFICULTIES.includes(difficulty as Difficulty)) return {};
  const meta = DIFFICULTY_META[difficulty as Difficulty];
  return {
    title: `Spotle Bollywood — ${meta.label}`,
    description: meta.blurb,
  };
}

export default async function DifficultyPage({ params }: PageProps<"/[difficulty]">) {
  const { difficulty } = await params;
  if (!DIFFICULTIES.includes(difficulty as Difficulty)) notFound();
  return <PuzzleScreen difficulty={difficulty as Difficulty} />;
}
