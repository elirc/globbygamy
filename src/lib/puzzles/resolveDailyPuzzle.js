import { buildPuzzlePayload } from "@/lib/puzzles/payload";
import { findSamplePuzzle } from "@/lib/puzzles/samplePuzzles";
import { prisma } from "@/lib/prisma";

function todayUtcDateString() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDateInput(input) {
  if (!input) {
    return todayUtcDateString();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return todayUtcDateString();
  }

  return parsed.toISOString().slice(0, 10);
}

function utcDateRange(dateString) {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  const end = new Date(`${dateString}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function normalizeSize(size) {
  if (!size) {
    return "MINI";
  }

  const normalized = String(size).toUpperCase();
  if (normalized !== "MINI" && normalized !== "BIG") {
    return "MINI";
  }

  return normalized;
}

function mapDbPuzzle(dbPuzzle) {
  return {
    id: dbPuzzle.id,
    locale: dbPuzzle.locale,
    size: dbPuzzle.size,
    type: dbPuzzle.type,
    date: dbPuzzle.date,
    title: dbPuzzle.title,
    isPublished: dbPuzzle.isPublished,
    groups: dbPuzzle.groups.map((group) => ({
      id: group.id,
      level: group.level,
      groupIndex: group.groupIndex,
      themeLabel: group.themeLabel,
      emojiHint: group.emojiHint,
      members: Array.isArray(group.members) ? group.members : [],
      parentGroupId: group.parentGroupId,
    })),
  };
}

export async function resolveDailyPuzzle({ locale = "en-US", size = "mini", date } = {}) {
  const normalizedSize = normalizeSize(size);
  const normalizedDate = normalizeDateInput(date);
  const { start, end } = utcDateRange(normalizedDate);

  try {
    const dbPuzzle = await prisma.puzzle.findFirst({
      where: {
        locale,
        size: normalizedSize,
        type: "DAILY",
        isPublished: true,
        date: {
          gte: start,
          lt: end,
        },
      },
      include: {
        groups: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (dbPuzzle && dbPuzzle.groups.length > 0) {
      return buildPuzzlePayload(mapDbPuzzle(dbPuzzle));
    }
  } catch (error) {
    // DB may not be configured yet in local setup; fallback handles this.
    console.warn("Falling back to sample puzzle:", error.message);
  }

  const samplePuzzle = findSamplePuzzle({
    locale,
    size: normalizedSize.toLowerCase(),
    date: normalizedDate,
  });

  if (!samplePuzzle) {
    return null;
  }

  return buildPuzzlePayload(samplePuzzle);
}
