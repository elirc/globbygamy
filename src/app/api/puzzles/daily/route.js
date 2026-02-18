import { NextResponse } from "next/server";

import { resolveDailyPuzzle } from "@/lib/puzzles/resolveDailyPuzzle";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "en-US";
  const size = searchParams.get("size") || "mini";
  const date = searchParams.get("date") || undefined;

  const puzzle = await resolveDailyPuzzle({ locale, size, date });

  if (!puzzle) {
    return NextResponse.json(
      { error: "No published puzzle found for the requested filters." },
      { status: 404 },
    );
  }

  return NextResponse.json(puzzle);
}
