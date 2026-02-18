const STORAGE_PREFIX = "globs-session";

function keyForPuzzle(puzzleId) {
  return `${STORAGE_PREFIX}:${puzzleId}`;
}

export function loadSession(puzzleId) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(keyForPuzzle(puzzleId));
    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(puzzleId, state) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(keyForPuzzle(puzzleId), JSON.stringify(state));
  } catch {
    // ignore localStorage failures (private mode / quota exceeded)
  }
}

export function clearSession(puzzleId) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(keyForPuzzle(puzzleId));
}
