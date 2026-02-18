const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SAMPLE_PUZZLES = [
  {
    id: "sample-mini-2026-02-18-en-us",
    locale: "en-US",
    size: "MINI",
    type: "DAILY",
    date: "2026-02-18",
    title: "Globs Daily Mini",
    isPublished: true,
    groups: [
      {
        id: "sample-mini-g0-a",
        level: 0,
        groupIndex: 0,
        themeLabel: "Cheeses",
        emojiHint: "🧀",
        members: ["Brie", "Gouda", "Cheddar", "Mozzarella"],
        parentGroupId: "sample-mini-g1-root",
      },
      {
        id: "sample-mini-g0-b",
        level: 0,
        groupIndex: 1,
        themeLabel: "Planets",
        emojiHint: "🪐",
        members: ["Mars", "Jupiter", "Saturn", "Neptune"],
        parentGroupId: "sample-mini-g1-root",
      },
      {
        id: "sample-mini-g0-c",
        level: 0,
        groupIndex: 2,
        themeLabel: "Shakespeare Plays",
        emojiHint: "🎭",
        members: ["Hamlet", "Macbeth", "Othello", "Tempest"],
        parentGroupId: "sample-mini-g1-root",
      },
      {
        id: "sample-mini-g0-d",
        level: 0,
        groupIndex: 3,
        themeLabel: "Programming Languages",
        emojiHint: "💻",
        members: ["JavaScript", "Python", "Rust", "Go"],
        parentGroupId: "sample-mini-g1-root",
      },
      {
        id: "sample-mini-g1-root",
        level: 1,
        groupIndex: 0,
        themeLabel: "Things with many varieties",
        emojiHint: "🌐",
        members: ["Cheeses", "Planets", "Shakespeare Plays", "Programming Languages"],
        parentGroupId: null,
      },
    ],
  },
];

function toUtcDate(dateString) {
  if (!dateString) {
    return null;
  }
  return new Date(`${dateString}T00:00:00.000Z`);
}

async function main() {
  for (const puzzle of SAMPLE_PUZZLES) {
    const puzzleDate = toUtcDate(puzzle.date);

    await prisma.puzzle.upsert({
      where: { id: puzzle.id },
      update: {
        locale: puzzle.locale,
        size: puzzle.size,
        type: puzzle.type,
        date: puzzleDate,
        title: puzzle.title,
        isPublished: puzzle.isPublished,
      },
      create: {
        id: puzzle.id,
        locale: puzzle.locale,
        size: puzzle.size,
        type: puzzle.type,
        date: puzzleDate,
        title: puzzle.title,
        isPublished: puzzle.isPublished,
      },
    });

    await prisma.puzzleGroup.deleteMany({
      where: {
        puzzleId: puzzle.id,
      },
    });

    await prisma.puzzleGroup.createMany({
      data: puzzle.groups.map((group) => ({
        id: group.id,
        puzzleId: puzzle.id,
        level: group.level,
        groupIndex: group.groupIndex,
        themeLabel: group.themeLabel,
        emojiHint: group.emojiHint,
        members: group.members,
        parentGroupId: group.parentGroupId,
      })),
    });
  }

  console.log(`Seeded ${SAMPLE_PUZZLES.length} puzzle(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
