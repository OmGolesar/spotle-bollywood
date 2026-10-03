import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { loadEditableFilm } from "@/lib/server/films";
import { saveFilm } from "./actions";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SearchParams = { saved?: string };

const QUALITY_OPTS: {
  value: "verified" | "tmdb_only" | "partial";
  label: string;
  blurb: string;
}[] = [
  { value: "verified", label: "Verified", blurb: "Checked by curator, ready to use." },
  { value: "tmdb_only", label: "TMDB only", blurb: "Base data from TMDB; curator hasn't reviewed." },
  { value: "partial", label: "Needs data", blurb: "Known gaps — flag for later." },
];

export default async function FilmEditor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID_RE.test(id)) notFound();

  const film = await loadEditableFilm(id);
  if (!film) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-6 sm:px-8 sm:py-10">
      <nav className="text-xs text-muted">
        <Link href="/admin/films" className="hover:text-foreground">
          ← Films
        </Link>
      </nav>

      <section className="flex gap-4">
        {film.poster_url && (
          <div className="relative hidden aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted sm:block">
            <Image
              src={film.poster_url}
              alt={`Poster for ${film.title}`}
              fill
              sizes="112px"
              unoptimized
            />
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Film
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            {film.title}
            <span className="ml-2 font-sans text-lg font-normal text-muted">
              ({film.year})
            </span>
          </h1>
          <p className="text-sm text-muted">
            {film.director.join(" & ") || "No director"} ·{" "}
            {film.cast_top3.slice(0, 3).join(", ") || "No cast"}
          </p>
          <p className="text-xs text-muted">
            {film.banner} · {film.genres.join(", ") || "no genres"}
            {film.music_directors.length > 0 && ` · music: ${film.music_directors.join(", ")}`}
          </p>
        </div>
      </section>

      {sp.saved === "1" && (
        <p
          className="rounded-xl border border-border px-4 py-3 text-sm"
          style={{ background: "color-mix(in srgb, var(--tile-green) 12%, var(--surface))", color: "var(--tile-green)" }}
          role="status"
        >
          Saved.
        </p>
      )}

      <form action={saveFilm} className="flex flex-col gap-6">
        <input type="hidden" name="id" value={film.id} />

        <Section title="Trivia">
          <Label htmlFor="trivia" hint="2–4 lines shown on the result screen.">
            Trivia
          </Label>
          <textarea
            id="trivia"
            name="trivia"
            rows={4}
            defaultValue={film.trivia}
            className={textareaCls}
          />
        </Section>

        <Section title="Tagline">
          <Label
            htmlFor="tagline"
            hint="The film's marketing tagline. Shown as one of the three in-game hint categories. Leave blank if there isn't one."
          >
            Tagline
          </Label>
          <input
            id="tagline"
            name="tagline"
            type="text"
            defaultValue={film.tagline ?? ""}
            placeholder="Palat..."
            className={inputCls}
            autoComplete="off"
          />
        </Section>

        <Section title="Numbers">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="box_office_cr" hint="Lifetime nett in ₹ crores.">Box office</Label>
              <input
                id="box_office_cr"
                name="box_office_cr"
                type="number"
                step="0.01"
                min="0"
                defaultValue={film.box_office_cr ?? ""}
                className={inputCls}
                inputMode="decimal"
              />
            </div>
            <div>
              <Label htmlFor="imdb_score" hint="0.0 – 10.0">IMDb score</Label>
              <input
                id="imdb_score"
                name="imdb_score"
                type="number"
                step="0.1"
                min="0"
                max="10"
                defaultValue={film.imdb_score ?? ""}
                className={inputCls}
                inputMode="decimal"
              />
            </div>
          </div>
        </Section>

        <Section title="Metadata">
          <Label htmlFor="banner_parent" hint="Shared parent / family label (e.g. Yash Raj Films → YRF). Used for the yellow banner tile.">
            Banner family
          </Label>
          <input
            id="banner_parent"
            name="banner_parent"
            type="text"
            defaultValue={film.banner_parent ?? ""}
            className={inputCls}
            autoComplete="off"
          />

          <Label htmlFor="where_to_watch_url" hint="JioCinema / Netflix / Prime etc. (optional)">
            Where to watch URL
          </Label>
          <input
            id="where_to_watch_url"
            name="where_to_watch_url"
            type="url"
            defaultValue={film.where_to_watch_url ?? ""}
            placeholder="https://…"
            className={inputCls}
          />
        </Section>

        <Section title="Data quality">
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Data quality</legend>
            {QUALITY_OPTS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-3 text-sm"
              >
                <input
                  type="radio"
                  name="data_quality"
                  value={opt.value}
                  defaultChecked={film.data_quality === opt.value}
                  className="mt-0.5"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{opt.label}</span>
                  <span className="text-xs text-muted">{opt.blurb}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </Section>

        <div className="sticky bottom-0 -mx-5 flex items-center justify-end gap-3 border-t border-border bg-background/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
          <Link
            href="/admin/films"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            Save changes
          </button>
        </div>
      </form>
    </main>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40";

const textareaCls =
  "w-full resize-y rounded-xl border border-border bg-surface px-3 py-2 text-sm leading-6 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40";

function Label({
  htmlFor,
  hint,
  children,
}: {
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1 flex flex-col gap-0.5">
      <label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wider text-muted">
        {children}
      </label>
      {hint && <p className="text-xs text-muted/80">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
