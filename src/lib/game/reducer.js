import { applyMerge, consumeHint, sortTiles, toggleTileColor, undo } from "@/lib/game/engine";

function normalizeBoard(board) {
  if (!Array.isArray(board)) {
    return [];
  }

  return board
    .map((tile) => ({
      id: tile.id,
      label: tile.label,
      level: tile.level,
      groupToken: tile.groupToken ?? null,
      leafIds: Array.isArray(tile.leafIds) ? [...tile.leafIds] : [],
      fragments: Array.isArray(tile.fragments) ? [...tile.fragments] : [tile.label],
      colorTag: tile.colorTag ?? null,
    }))
    .filter((tile) => tile.id && tile.label);
}

export function serializeState(state) {
  return {
    schemaVersion: state.schemaVersion,
    puzzleId: state.puzzleId,
    board: normalizeBoard(state.board),
    mistakes: state.mistakes,
    hintsUsed: state.hintsUsed,
    moveCount: state.moveCount,
    status: state.status,
    startTime: state.startTime,
    completedAt: state.completedAt,
    completedGroupTokens: [...state.completedGroupTokens],
    revealedHintTokens: [...state.revealedHintTokens],
    undoStack: state.undoStack,
    nextId: state.nextId,
  };
}

function hydrateState(initialState, savedState) {
  if (!savedState) {
    return initialState;
  }

  if (savedState.schemaVersion !== initialState.schemaVersion) {
    return initialState;
  }

  if (savedState.puzzleId !== initialState.puzzleId) {
    return initialState;
  }

  const hydratedBoard = normalizeBoard(savedState.board);
  if (hydratedBoard.length === 0) {
    return initialState;
  }

  return {
    ...initialState,
    board: hydratedBoard,
    mistakes: Number(savedState.mistakes) || 0,
    hintsUsed: Number(savedState.hintsUsed) || 0,
    moveCount: Number(savedState.moveCount) || 0,
    status: savedState.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
    startTime: Number(savedState.startTime) || Date.now(),
    completedAt: savedState.completedAt || null,
    completedGroupTokens: Array.isArray(savedState.completedGroupTokens)
      ? savedState.completedGroupTokens
      : [],
    revealedHintTokens: Array.isArray(savedState.revealedHintTokens)
      ? savedState.revealedHintTokens
      : [],
    undoStack: Array.isArray(savedState.undoStack) ? savedState.undoStack : [],
    nextId: Number(savedState.nextId) || 1,
    selectedTileId: null,
    lastFeedback: null,
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return hydrateState(state, action.payload);
    case "SELECT_TILE":
      if (state.status === "COMPLETED") {
        return state;
      }

      return {
        ...state,
        selectedTileId: state.selectedTileId === action.tileId ? null : action.tileId,
        lastFeedback: null,
      };
    case "ATTEMPT_MERGE":
      return applyMerge(state, action.sourceTileId, action.targetTileId);
    case "TOGGLE_COLOR":
      return toggleTileColor(state, action.tileId);
    case "SORT_ALPHA":
      return sortTiles(state, "alpha");
    case "SHUFFLE":
      return sortTiles(state, "shuffle");
    case "USE_HINT":
      return consumeHint(state);
    case "UNDO":
      return undo(state);
    case "CLEAR_FEEDBACK":
      return {
        ...state,
        lastFeedback: null,
      };
    default:
      return state;
  }
}
