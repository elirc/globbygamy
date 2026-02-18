"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { createInitialState, MAX_HINTS } from "@/lib/game/engine";
import { gameReducer, serializeState } from "@/lib/game/reducer";
import { loadSession, saveSession } from "@/lib/game/storage";

const LEVEL_STYLES = {
  0: "bg-slate-100 text-slate-950 border-slate-300",
  1: "bg-amber-100 text-amber-900 border-amber-300",
  2: "bg-cyan-100 text-cyan-900 border-cyan-300",
  3: "bg-lime-100 text-lime-900 border-lime-300",
};

const TAG_STYLES = {
  rose: "ring-2 ring-rose-400",
  sky: "ring-2 ring-sky-400",
  emerald: "ring-2 ring-emerald-400",
  amber: "ring-2 ring-amber-500",
};

const SHARE_ROW_COLORS = ["🟩", "🟦", "🟨", "🟪", "🟧", "🟥"];

function formatSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function boardColumns(boardLength) {
  if (boardLength <= 1) return 1;
  if (boardLength <= 4) return 2;
  if (boardLength <= 9) return 3;
  if (boardLength <= 16) return 4;
  if (boardLength <= 36) return 6;
  return 8;
}

function makeShareText(state, elapsedSeconds) {
  const lines = state.completedGroupTokens.map((token, index) => {
    const group = state.groupsByToken[token];
    const color = SHARE_ROW_COLORS[index % SHARE_ROW_COLORS.length];
    const emoji = group?.emojiHint || "🔹";
    return `${color}${color}${color}${color} -> ${emoji}`;
  });

  lines.push("");
  lines.push(`Globs ${state.size.toUpperCase()} ${state.date}`);
  lines.push(`Time ${formatSeconds(elapsedSeconds)} | Mistakes ${state.mistakes} | Hints ${state.hintsUsed}`);

  return lines.join("\n");
}

async function copyToClipboard(value) {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function GameClient({ puzzle }) {
  const [state, dispatch] = useReducer(gameReducer, puzzle, createInitialState);
  const [copied, setCopied] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const skipPersistRef = useRef(true);

  useEffect(() => {
    skipPersistRef.current = true;
    const savedState = loadSession(puzzle.puzzleId);
    if (savedState) {
      dispatch({ type: "HYDRATE", payload: savedState });
    }
  }, [puzzle.puzzleId]);

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }

    saveSession(puzzle.puzzleId, serializeState(state));
  }, [puzzle.puzzleId, state]);

  useEffect(() => {
    if (state.status === "COMPLETED") {
      return;
    }

    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [state.status]);

  useEffect(() => {
    if (!state.lastFeedback) {
      return;
    }

    const timer = window.setTimeout(() => {
      dispatch({ type: "CLEAR_FEEDBACK" });
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [state.lastFeedback]);

  const elapsedSeconds = Math.max(
    0,
    Math.floor(((state.completedAt || clock) - state.startTime) / 1000),
  );
  const columns = boardColumns(state.board.length);
  const revealedHints = state.revealedHintTokens
    .map((token) => state.groupsByToken[token])
    .filter(Boolean);

  const shareText = useMemo(
    () => makeShareText(state, elapsedSeconds),
    [elapsedSeconds, state],
  );

  const onTileTap = (tileId) => {
    if (!state.selectedTileId) {
      dispatch({ type: "SELECT_TILE", tileId });
      return;
    }

    if (state.selectedTileId === tileId) {
      dispatch({ type: "SELECT_TILE", tileId });
      return;
    }

    dispatch({
      type: "ATTEMPT_MERGE",
      sourceTileId: state.selectedTileId,
      targetTileId: tileId,
    });
  };

  const onCopyShare = async () => {
    const ok = await copyToClipboard(shareText);
    setCopied(ok);
    if (ok) {
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="rounded-3xl border border-slate-300 bg-white/90 p-5 shadow-lg shadow-cyan-950/5 backdrop-blur">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Daily Puzzle
            </p>
            <h1 className="font-sans text-3xl text-slate-900">
              {state.title}
            </h1>
            <p className="text-sm text-slate-600">
              {state.locale} | {state.size.toUpperCase()} | {state.date}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="Time" value={formatSeconds(elapsedSeconds)} />
            <Stat label="Mistakes" value={String(state.mistakes)} />
            <Stat label="Hints" value={`${state.hintsUsed}/${MAX_HINTS}`} />
            <Stat label="Moves" value={String(state.moveCount)} />
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-300 bg-white/90 p-4 shadow-lg shadow-cyan-950/5 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          <ControlButton onClick={() => dispatch({ type: "SORT_ALPHA" })}>
            Sort A-Z
          </ControlButton>
          <ControlButton onClick={() => dispatch({ type: "SHUFFLE" })}>
            Shuffle
          </ControlButton>
          <ControlButton
            onClick={() => dispatch({ type: "USE_HINT" })}
            disabled={state.hintsUsed >= MAX_HINTS}
          >
            Hint
          </ControlButton>
          <ControlButton
            onClick={() => dispatch({ type: "UNDO" })}
            disabled={state.undoStack.length === 0}
          >
            Undo
          </ControlButton>
          {state.status === "COMPLETED" ? (
            <ControlButton onClick={onCopyShare}>{copied ? "Copied" : "Copy Share"}</ControlButton>
          ) : null}
        </div>

        {revealedHints.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {revealedHints.map((hint) => (
              <span
                key={hint.token}
                className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-700"
              >
                {hint.emojiHint || "🔹"} L{hint.level + 1}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="relative rounded-3xl border border-slate-300 bg-white/90 p-4 shadow-lg shadow-cyan-950/5 backdrop-blur">
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {state.board.map((tile) => {
            const isSelected = state.selectedTileId === tile.id;
            const levelStyle = LEVEL_STYLES[tile.level] || LEVEL_STYLES[0];
            const tagStyle = tile.colorTag ? TAG_STYLES[tile.colorTag] : "";

            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => onTileTap(tile.id)}
                onDoubleClick={() => dispatch({ type: "TOGGLE_COLOR", tileId: tile.id })}
                className={[
                  "group min-h-20 rounded-2xl border px-3 py-2 text-left text-sm font-medium transition duration-150",
                  "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600",
                  levelStyle,
                  tagStyle,
                  isSelected ? "scale-[1.02] border-cyan-600 ring-2 ring-cyan-500/60" : "",
                ].join(" ")}
              >
                <p className="line-clamp-3 break-words">{tile.label}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.16em] opacity-60">
                  Level {tile.level}
                </p>
              </button>
            );
          })}
        </div>

        {state.lastFeedback ? (
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {state.lastFeedback}
          </p>
        ) : null}
      </section>

      {state.status === "COMPLETED" ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-slate-900 shadow-lg shadow-emerald-800/10">
          <h2 className="font-sans text-2xl">Puzzle Complete</h2>
          <p className="mt-1 text-sm text-slate-700">
            {formatSeconds(elapsedSeconds)} with {state.mistakes} mistake(s) and {state.hintsUsed} hint(s).
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-emerald-200 bg-white p-3 text-xs leading-relaxed text-slate-700">
            {shareText}
          </pre>
        </section>
      ) : null}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="font-mono text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ControlButton({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition",
        "hover:border-slate-900 hover:bg-slate-900 hover:text-white",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:bg-transparent disabled:hover:text-slate-800",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
