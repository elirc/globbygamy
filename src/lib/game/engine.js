export const MAX_HINTS = 3;
export const COLOR_TAGS = [null, "rose", "sky", "emerald", "amber"];

function toGroupLookup(groups) {
  return Object.fromEntries(groups.map((group) => [group.token, group]));
}

function normalizeTile(tile) {
  return {
    id: tile.id,
    label: tile.label,
    level: tile.level,
    groupToken: tile.groupToken,
    leafIds: [tile.leafId],
    fragments: [tile.label],
    colorTag: null,
  };
}

function cloneTile(tile) {
  return {
    ...tile,
    leafIds: [...tile.leafIds],
    fragments: [...tile.fragments],
  };
}

function cloneBoard(board) {
  return board.map((tile) => cloneTile(tile));
}

function mergeUnique(values) {
  return [...new Set(values)];
}

function randomSort(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function makeUndoSnapshot(state) {
  return {
    board: cloneBoard(state.board),
    mistakes: state.mistakes,
    moveCount: state.moveCount,
    status: state.status,
    completedAt: state.completedAt,
    completedGroupTokens: [...state.completedGroupTokens],
    nextId: state.nextId,
  };
}

export function createInitialState(puzzle) {
  return {
    schemaVersion: 1,
    puzzleId: puzzle.puzzleId,
    title: puzzle.title,
    date: puzzle.date,
    size: puzzle.size,
    locale: puzzle.locale,
    groupsByToken: toGroupLookup(puzzle.groups),
    board: puzzle.tiles.map((tile) => normalizeTile(tile)),
    selectedTileId: null,
    mistakes: 0,
    hintsUsed: 0,
    moveCount: 0,
    status: "IN_PROGRESS",
    startTime: Date.now(),
    completedAt: null,
    completedGroupTokens: [],
    revealedHintTokens: [],
    undoStack: [],
    lastFeedback: null,
    nextId: 1,
  };
}

export function applyMerge(state, sourceTileId, targetTileId) {
  if (state.status === "COMPLETED") {
    return state;
  }

  if (!sourceTileId || !targetTileId || sourceTileId === targetTileId) {
    return {
      ...state,
      selectedTileId: null,
      lastFeedback: "Pick two different tiles.",
    };
  }

  const sourceTile = state.board.find((tile) => tile.id === sourceTileId);
  const targetTile = state.board.find((tile) => tile.id === targetTileId);

  if (!sourceTile || !targetTile) {
    return {
      ...state,
      selectedTileId: null,
      lastFeedback: "Those tiles are no longer on the board.",
    };
  }

  if (sourceTile.level !== targetTile.level) {
    return {
      ...state,
      selectedTileId: null,
      mistakes: state.mistakes + 1,
      lastFeedback: "Tiles must be at the same level.",
    };
  }

  if (sourceTile.groupToken !== targetTile.groupToken) {
    return {
      ...state,
      selectedTileId: null,
      mistakes: state.mistakes + 1,
      lastFeedback: "Wrong merge.",
    };
  }

  const group = state.groupsByToken[sourceTile.groupToken];
  if (!group) {
    return {
      ...state,
      selectedTileId: null,
      lastFeedback: "Missing group data for this tile.",
    };
  }

  const mergedLeafIds = mergeUnique([...sourceTile.leafIds, ...targetTile.leafIds]);
  const mergedFragments = mergeUnique([...sourceTile.fragments, ...targetTile.fragments]);
  const isUpgrade = mergedLeafIds.length >= group.totalLeafCount;

  const mergedTile = {
    id: `m${state.nextId}`,
    level: sourceTile.level,
    groupToken: sourceTile.groupToken,
    leafIds: mergedLeafIds,
    fragments: mergedFragments,
    colorTag: sourceTile.colorTag || targetTile.colorTag || null,
    label: mergedFragments.join(" · "),
  };

  if (isUpgrade) {
    mergedTile.level = sourceTile.level + 1;
    mergedTile.groupToken = group.parentToken;
    mergedTile.fragments = [group.themeLabel];
    mergedTile.label = group.themeLabel;
  } else if (mergedTile.label.length > 44) {
    mergedTile.label = `${mergedFragments.length} linked tiles`;
  }

  const boardWithoutInputs = state.board.filter(
    (tile) => tile.id !== sourceTileId && tile.id !== targetTileId,
  );
  const nextBoard = [...boardWithoutInputs, mergedTile];
  const isComplete = nextBoard.length === 1 && mergedTile.groupToken === null;
  const feedback = isUpgrade ? `Completed group: ${group.themeLabel}` : "Merge successful.";

  return {
    ...state,
    board: nextBoard,
    selectedTileId: null,
    moveCount: state.moveCount + 1,
    status: isComplete ? "COMPLETED" : state.status,
    completedAt: isComplete ? Date.now() : state.completedAt,
    completedGroupTokens: isUpgrade
      ? mergeUnique([...state.completedGroupTokens, sourceTile.groupToken])
      : state.completedGroupTokens,
    undoStack: [...state.undoStack, makeUndoSnapshot(state)],
    lastFeedback: isComplete ? "Puzzle complete." : feedback,
    nextId: state.nextId + 1,
  };
}

export function toggleTileColor(state, tileId) {
  return {
    ...state,
    board: state.board.map((tile) => {
      if (tile.id !== tileId) {
        return tile;
      }

      const currentIndex = COLOR_TAGS.indexOf(tile.colorTag);
      const nextIndex = (currentIndex + 1) % COLOR_TAGS.length;
      return {
        ...tile,
        colorTag: COLOR_TAGS[nextIndex],
      };
    }),
  };
}

export function sortTiles(state, mode = "alpha") {
  const sorted =
    mode === "shuffle"
      ? randomSort(state.board)
      : [...state.board].sort((left, right) => left.label.localeCompare(right.label));

  return {
    ...state,
    board: sorted,
    selectedTileId: null,
  };
}

export function consumeHint(state) {
  if (state.hintsUsed >= MAX_HINTS) {
    return {
      ...state,
      lastFeedback: `No hints remaining (${MAX_HINTS} max).`,
    };
  }

  const groups = Object.values(state.groupsByToken).sort((left, right) => {
    if (left.level === right.level) {
      return left.token.localeCompare(right.token);
    }
    return left.level - right.level;
  });

  const candidates = groups.filter(
    (group) =>
      group.level === 0 &&
      !state.completedGroupTokens.includes(group.token) &&
      !state.revealedHintTokens.includes(group.token),
  );
  const selected = candidates[0] || groups.find((group) => !state.revealedHintTokens.includes(group.token));

  if (!selected) {
    return {
      ...state,
      lastFeedback: "All hints already revealed.",
    };
  }

  const hintText = selected.emojiHint ? `Hint: ${selected.emojiHint}` : "Hint unlocked.";

  return {
    ...state,
    hintsUsed: state.hintsUsed + 1,
    revealedHintTokens: [...state.revealedHintTokens, selected.token],
    lastFeedback: hintText,
  };
}

export function undo(state) {
  if (state.undoStack.length === 0) {
    return {
      ...state,
      lastFeedback: "Nothing to undo.",
    };
  }

  const previous = state.undoStack[state.undoStack.length - 1];

  return {
    ...state,
    board: cloneBoard(previous.board),
    mistakes: previous.mistakes,
    moveCount: previous.moveCount,
    status: previous.status,
    completedAt: previous.completedAt,
    completedGroupTokens: [...previous.completedGroupTokens],
    undoStack: state.undoStack.slice(0, -1),
    selectedTileId: null,
    nextId: previous.nextId,
    lastFeedback: "Undo applied.",
  };
}
