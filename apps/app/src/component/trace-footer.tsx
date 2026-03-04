import { StackFrame, TraceLevel } from "@novx/core";
import { useState, useRef, useEffect, useCallback } from "react";


// ─── Types ────────────────────────────────────────────────────────────────────

export class TraceEntry {
  path: string;
  level: TraceLevel;
  message: string;
  timestamp: Date = new Date();
  stackFrame: StackFrame;

  constructor(
    path: string,
    level: TraceLevel,
    message: string,
    timestamp: Date,
    stackFrame: StackFrame
  ) {
    this.path = path;
    this.level = level;
    this.message = message;
    this.timestamp = timestamp;
    this.stackFrame = stackFrame;
  }
}

interface TraceFooterProps {
  entries: TraceEntry[];
  maxEntries?: number;
  onClear?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_META: Record<
  TraceLevel,
  { label: string; color: string; bg: string; dot: string }
> = {
  [TraceLevel.OFF]:    { label: "OFF",  color: "#6b7280", bg: "rgba(107,114,128,0.08)", dot: "#6b7280" },
  [TraceLevel.LOW]:    { label: "LOW",  color: "#34d399", bg: "rgba(52,211,153,0.08)",  dot: "#34d399" },
  [TraceLevel.MEDIUM]: { label: "MED",  color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  dot: "#fbbf24" },
  [TraceLevel.HIGH]:   { label: "HIGH", color: "#f87171", bg: "rgba(248,113,113,0.08)", dot: "#f87171" },
  [TraceLevel.FULL]:   { label: "FULL", color: "#e879f9", bg: "rgba(232,121,249,0.08)", dot: "#e879f9" },
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions);
}

function formatPath(path: string): string {
    return path
  //const parts = path.split(/[./]/);
  //return parts[parts.length - 1] || path;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TraceFooter({
  entries,
  maxEntries = 200,
  onClear,
}: TraceFooterProps) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(320);
  const [filterLevel, setFilterLevel] = useState<TraceLevel | null>(null);
  const [filterPath, setFilterPath] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<TraceEntry | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const isDragging = useRef(false);

  const listRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries, autoScroll, open]);

  // Drag-to-resize
  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      dragRef.current = { startY: e.clientY, startH: height };

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const delta = dragRef.current.startY - ev.clientY;
        setHeight(
          Math.max(140, Math.min(window.innerHeight * 0.8, dragRef.current.startH + delta))
        );
      };
      const onUp = () => {
        dragRef.current = null;
        isDragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [height]
  );

  const visible = entries
    .slice(-maxEntries)
    .filter((e) => {
      if (filterLevel !== null && e.level !== filterLevel) return false;
      if (filterPath && !e.path.toLowerCase().includes(filterPath.toLowerCase()))
        return false;
      return true;
    });

  const counts = (
    Object.values(TraceLevel).filter((v): v is TraceLevel => typeof v === "number") as TraceLevel[]
  ).reduce<Record<number, number>>((acc, lvl) => {
    acc[lvl] = entries.filter((e) => e.level === lvl).length;
    return acc;
  }, {});

  const lastEntry = entries[entries.length - 1];

  return (
    <>
      {/* ── Slide-out panel ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: open ? height : 0,
          transition: isDragging.current ? "none" : "height 0.28s cubic-bezier(.4,0,.2,1)",
          background: "#0d1117",
          borderTop: open ? "1px solid #21262d" : "none",
          zIndex: 9998,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        }}
      >
        {/* Resize handle */}
        <div
          onMouseDown={onDragStart}
          style={{ height: 4, cursor: "ns-resize", background: "transparent", flexShrink: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#30363d")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        />

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 12px",
            borderBottom: "1px solid #21262d",
            flexShrink: 0,
            background: "#161b22",
          }}
        >
          <span style={{ color: "#8b949e", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
            Trace
          </span>
          <span style={{ color: "#30363d", fontSize: 10 }}>|</span>

          {/* Level filters */}
          {(
            Object.values(TraceLevel).filter((v): v is TraceLevel => typeof v === "number") as TraceLevel[]
          ).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(filterLevel === lvl ? null : lvl)}
              style={{
                background: filterLevel === lvl ? LEVEL_META[lvl].bg : "transparent",
                border: `1px solid ${filterLevel === lvl ? LEVEL_META[lvl].color : "#30363d"}`,
                borderRadius: 3,
                color: LEVEL_META[lvl].color,
                fontSize: 10,
                padding: "1px 7px",
                cursor: "pointer",
                letterSpacing: 0.5,
                opacity: counts[lvl] === 0 ? 0.35 : 1,
              }}
            >
              {LEVEL_META[lvl].label}
              {counts[lvl] > 0 && (
                <span style={{ marginLeft: 4, opacity: 0.7 }}>{counts[lvl]}</span>
              )}
            </button>
          ))}

          <span style={{ color: "#30363d", fontSize: 10 }}>|</span>

          {/* Path filter */}
          <select
            value={filterPath}
            onChange={(e) => setFilterPath(e.target.value)}
            style={{
              background: "#0d1117",
              border: "1px solid #30363d",
              borderRadius: 3,
              color: filterPath ? "#c9d1d9" : "#484f58",
              fontSize: 11,
              padding: "2px 8px",
              outline: "none",
              width: 180,
              cursor: "pointer",
            }}
          >
            <option value="">all paths…</option>
            {[...new Set(entries.map((e) => e.path))].sort().map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <span style={{ color: "#8b949e", fontSize: 10, marginLeft: "auto" }}>
            {visible.length}/{entries.length}
          </span>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll((v) => !v)}
            title="Toggle auto-scroll"
            style={{
              background: autoScroll ? "rgba(56,189,248,0.12)" : "transparent",
              border: `1px solid ${autoScroll ? "#38bdf8" : "#30363d"}`,
              borderRadius: 3,
              color: autoScroll ? "#38bdf8" : "#6b7280",
              fontSize: 10,
              padding: "1px 7px",
              cursor: "pointer",
            }}
          >
            ↓ scroll
          </button>

          {onClear && (
            <button
              onClick={onClear}
              style={{
                background: "transparent",
                border: "1px solid #30363d",
                borderRadius: 3,
                color: "#6b7280",
                fontSize: 10,
                padding: "1px 7px",
                cursor: "pointer",
              }}
            >
              clear
            </button>
          )}
        </div>

        {/* Split: list + detail */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Entry list */}
          <div
            ref={listRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
              setAutoScroll(atBottom);
            }}
            style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
          >
            {visible.length === 0 ? (
              <div
                style={{
                  color: "#30363d",
                  fontSize: 12,
                  padding: "24px 16px",
                  textAlign: "center",
                }}
              >
                no trace entries
              </div>
            ) : (
              visible.map((entry, i) => {
                const meta = LEVEL_META[entry.level];
                const isSelected = selectedEntry === entry;
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedEntry(isSelected ? null : entry)}
                    style={{
                      display: "grid",
                     gridTemplateColumns: "88px 44px minmax(160px, 220px) 1fr",
                      gap: "0 12px",
                      alignItems: "center",
                      padding: "3px 12px",
                      cursor: "pointer",
                      background: isSelected ? "rgba(56,189,248,0.07)" : "transparent",
                      borderLeft: isSelected ? "2px solid #38bdf8" : "2px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#161b22";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span style={{ color: "#484f58", fontSize: 10.5, letterSpacing: 0.3 }}>
                      {formatTime(entry.timestamp)}
                    </span>
                    <span
                      style={{
                        color: meta.color,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 0.8,
                        background: meta.bg,
                        padding: "1px 4px",
                        borderRadius: 2,
                        textAlign: "center",
                      }}
                    >
                      {meta.label}
                    </span>
                    <span
                      style={{
                        color: "#8b949e",
                        fontSize: 11,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={entry.path}
                    >
                      {formatPath(entry.path)}
                    </span>
                    <span
                      style={{
                        color: "#c9d1d9",
                        fontSize: 11.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Detail panel */}
          {selectedEntry && (
            <div
              style={{
                width: 320,
                flexShrink: 0,
                borderLeft: "1px solid #21262d",
                background: "#161b22",
                overflowY: "auto",
                padding: "12px 14px",
                fontSize: 11,
                color: "#8b949e",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span
                  style={{ color: "#c9d1d9", fontWeight: 700, fontSize: 11, letterSpacing: 1 }}
                >
                  DETAIL
                </span>
                <button
                  onClick={() => setSelectedEntry(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#484f58",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  ✕
                </button>
              </div>

              <DetailRow label="Level">
                <span style={{ color: LEVEL_META[selectedEntry.level].color, fontWeight: 700 }}>
                  {LEVEL_META[selectedEntry.level].label} ({selectedEntry.level})
                </span>
              </DetailRow>
              <DetailRow label="Time">{formatTime(selectedEntry.timestamp)}</DetailRow>
              <DetailRow label="Path">
                <span style={{ color: "#79c0ff", wordBreak: "break-all" }}>
                  {selectedEntry.path}
                </span>
              </DetailRow>
              <DetailRow label="Message">
                <span style={{ color: "#c9d1d9", wordBreak: "break-all" }}>
                  {selectedEntry.message}
                </span>
              </DetailRow>

              {selectedEntry.stackFrame && (
                <>
                  <div
                    style={{
                      borderTop: "1px solid #21262d",
                      margin: "10px 0",
                      paddingTop: 10,
                    }}
                  >
                    <span
                      style={{
                        color: "#6b7280",
                        fontSize: 10,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      Stack Frame
                    </span>
                  </div>
                  {(Object.entries(selectedEntry.stackFrame) as [string, unknown][]).map(
                    ([k, v]) => (
                      <DetailRow key={k} label={k}>
                        <span style={{ color: "#c9d1d9", wordBreak: "break-all" }}>
                          {String(v)}
                        </span>
                      </DetailRow>
                    )
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tab / toggle button ── */}
      <div
        style={{
          position: "fixed",
          bottom: open ? height : 0,
          right: 24,
          zIndex: 9999,
          transition: isDragging.current ? "none" : "bottom 0.28s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#161b22",
            border: "1px solid #30363d",
            borderBottom: open ? "1px solid #0d1117" : "1px solid #30363d",
            borderRadius: "6px 6px 0 0",
            color: "#8b949e",
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: 0.5,
            padding: "5px 14px 5px 10px",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: lastEntry ? LEVEL_META[lastEntry.level].dot : "#484f58",
              boxShadow: lastEntry
                ? `0 0 5px ${LEVEL_META[lastEntry.level].dot}`
                : "none",
              flexShrink: 0,
            }}
          />
          TRACES
          {entries.length > 0 && (
            <span
              style={{
                background: "#21262d",
                borderRadius: 10,
                color: "#8b949e",
                fontSize: 10,
                padding: "0 6px",
              }}
            >
              {entries.length}
            </span>
          )}
          <span style={{ fontSize: 10, marginLeft: 2, opacity: 0.5 }}>
            {open ? "▼" : "▲"}
          </span>
        </button>
      </div>
    </>
  );
}

// ─── Detail row helper ────────────────────────────────────────────────────────

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
      <span
        style={{
          color: "#484f58",
          fontSize: 10,
          width: 64,
          flexShrink: 0,
          paddingTop: 1,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 11 }}>{children}</span>
    </div>
  );
}