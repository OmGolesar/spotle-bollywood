import { notFound } from "next/navigation";
import { DIFFICULTIES, DIFFICULTY_META, type Difficulty } from "@/lib/difficulty";
import { ArchivePuzzleScreen } from "@/components/ArchivePuzzleScreen";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Params = { date: string; difficulty: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { date, difficulty } = await params;
  if (!DIFFICULTIES.includes(difficulty as Difficulty) || !DATE_RE.test(date)) {
    return {};
  }
  const meta = DIFFICULTY_META[difficulty as Difficulty];
  return {
    title: `Spotle Bollywood — Archive ${date} (${meta.label})`,
    description: `Practice the ${meta.label} puzzle from ${date}.`,
  };
}

export default async function ArchivePuzzlePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { date, difficulty } = await params;
  if (!DIFFICULTIES.includes(difficulty as Difficulty)) notFound();
  if (!DATE_RE.test(date)) notFound();
  return <ArchivePuzzleScreen date={date} difficulty={difficulty as Difficulty} />;
}
