import { createHash } from "node:crypto";

function normalizeDateString(input) {
  if (!input) {
    return new Date().toISOString().slice(0, 10);
  }

  if (typeof input === "string") {
    return input.slice(0, 10);
  }

  return input.toISOString().slice(0, 10);
}

function tokenFromParts(...parts) {
  const value = parts.join(":");
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function seededShuffle(items, seedText) {
  const seedHex = tokenFromParts("seed", seedText).slice(0, 8);
  let seed = Number.parseInt(seedHex, 16) || 1;
  const output = [...items];

  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return Math.abs(seed) / 2_147_483_647;
  };

  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rand() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }

  return output;
}

function computeLeafCounts(groups) {
  const groupsById = new Map();
  const childIdsByParentId = new Map();

  groups.forEach((group) => {
    groupsById.set(group.id, group);

    if (!group.parentGroupId) {
      return;
    }

    const list = childIdsByParentId.get(group.parentGroupId) || [];
    list.push(group.id);
    childIdsByParentId.set(group.parentGroupId, list);
  });

  const memo = new Map();

  const countLeaves = (groupId) => {
    if (memo.has(groupId)) {
      return memo.get(groupId);
    }

    const group = groupsById.get(groupId);
    if (!group) {
      return 0;
    }

    const members = Array.isArray(group.members) ? group.members : [];
    const childIds = childIdsByParentId.get(groupId) || [];

    let count = members.length;
    if (childIds.length > 0) {
      count = childIds.reduce((sum, childId) => sum + countLeaves(childId), 0);
    }

    memo.set(groupId, count);
    return count;
  };

  groups.forEach((group) => countLeaves(group.id));
  return memo;
}

export function buildPuzzlePayload(puzzle) {
  const orderedGroups = [...puzzle.groups].sort((left, right) => {
    if (left.level === right.level) {
      return left.groupIndex - right.groupIndex;
    }
    return left.level - right.level;
  });

  const leafCounts = computeLeafCounts(orderedGroups);
  const date = normalizeDateString(puzzle.date);
  const groupTokenById = new Map(
    orderedGroups.map((group) => [group.id, tokenFromParts("group", puzzle.id, group.id)]),
  );

  const groups = orderedGroups.map((group) => ({
    token: groupTokenById.get(group.id),
    level: group.level,
    parentToken: group.parentGroupId ? groupTokenById.get(group.parentGroupId) : null,
    themeLabel: group.themeLabel,
    emojiHint: group.emojiHint || null,
    totalLeafCount: leafCounts.get(group.id) || 0,
  }));

  const tiles = [];
  orderedGroups
    .filter((group) => group.level === 0)
    .forEach((group) => {
      const groupToken = groupTokenById.get(group.id);
      const members = Array.isArray(group.members) ? group.members : [];

      members.forEach((label, index) => {
        const leafId = `${groupToken}-${index + 1}`;
        tiles.push({
          id: leafId,
          leafId,
          level: 0,
          label: String(label),
          groupToken,
        });
      });
    });

  return {
    puzzleId: puzzle.id,
    locale: puzzle.locale,
    size: String(puzzle.size).toLowerCase(),
    date,
    title: puzzle.title || "Globs",
    groups,
    tiles: seededShuffle(tiles, `${puzzle.id}:${date}`),
  };
}
