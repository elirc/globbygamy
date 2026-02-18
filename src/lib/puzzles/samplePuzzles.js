const sampleMiniDaily = {
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
};

export const SAMPLE_PUZZLES = [sampleMiniDaily];

export function findSamplePuzzle({ locale = "en-US", size = "mini", date }) {
  const normalizedSize = size.toUpperCase();
  const normalizedDate = date || sampleMiniDaily.date;

  return SAMPLE_PUZZLES.find(
    (puzzle) =>
      puzzle.locale === locale &&
      puzzle.size === normalizedSize &&
      puzzle.date === normalizedDate &&
      puzzle.type === "DAILY" &&
      puzzle.isPublished,
  );
}
