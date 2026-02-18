import GameClient from "@/components/globs/GameClient";
import { resolveDailyPuzzle } from "@/lib/puzzles/resolveDailyPuzzle";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const locale = params?.locale || "en-US";
  const size = params?.size || "mini";
  const date = params?.date || undefined;

  const puzzle = await resolveDailyPuzzle({ locale, size, date });

  if (!puzzle) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-16">
        <div className="w-full rounded-3xl border border-red-200 bg-white/90 p-6 text-red-700">
          <h1 className="font-sans text-2xl">No puzzle available</h1>
          <p className="mt-2 text-sm">
            No published daily puzzle matched locale={locale}, size={size}, date=
            {date || "today"}.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
      <GameClient puzzle={puzzle} />
    </main>
  );
}
