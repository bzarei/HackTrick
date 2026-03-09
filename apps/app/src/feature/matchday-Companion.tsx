import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { EnvironmentContext, Feature } from "@novx/portal";
import { Environment } from "@novx/core";

// ═══════════════════════════════════════════════════════════════════════════════
// ███ MATCHDAY COMPANION — Challenge 2 ███
// A lightweight matchday companion web app: live ticker, stats, standings,
// rule-based + Gemini AI summaries. Fully self-contained, no external sports API.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

type MatchdayTab = "live" | "stats" | "table" | "summary";

interface MatchEvent {
  id: number;
  minute: number;
  type:
    | "goal"
    | "yellow"
    | "red"
    | "substitution"
    | "var"
    | "half-time"
    | "full-time"
    | "kickoff"
    | "penalty"
    | "corner"
    | "injury"
    | "save";
  team?: "home" | "away";
  player?: string;
  assist?: string;
  detail?: string;
}

interface MatchStats {
  possession: [number, number];
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  xG: [number, number];
  passes: [number, number];
  passAccuracy: [number, number];
  offsides: [number, number];
}

interface TeamInfo {
  name: string;
  shortName: string;
  flag: string;
  color: string;
}

interface StandingsRow {
  team: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
}

// ── Theme (Telekom magenta & white) ─────────────────────────────────────────

const C = {
  bg: "#ffffff",
  card: "#fff0f6",
  cardBorder: "rgba(226,0,116,0.15)",
  primary: "#e20074",
  primaryDark: "#b0005c",
  accent: "#ff3399",
  gold: "#e20074",
  red: "#ef4444",
  text: "#1a1a1a",
  dim: "#777777",
  surface: "rgba(226,0,116,0.04)",
  scoreBg: "#fff5f9",
};

// ── CSS Keyframes ───────────────────────────────────────────────────────────

const KEYFRAMES = `
@keyframes mc-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes mc-slideIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
@keyframes mc-newEvt  { from{background:rgba(226,0,116,.12)} to{background:transparent} }
@keyframes mc-fadeIn  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// ███ MOCK DATA — World Cup 2022 Final: Argentina vs France ███
// ═══════════════════════════════════════════════════════════════════════════════

const HOME_TEAM: TeamInfo = { name: "Argentina", shortName: "ARG", flag: "🇦🇷", color: "#75aadb" };
const AWAY_TEAM: TeamInfo = { name: "France", shortName: "FRA", flag: "🇫🇷", color: "#003399" };

const FULL_EVENTS: MatchEvent[] = [
  { id: 1,  minute: 0,   type: "kickoff",      detail: "The referee blows the whistle — kick-off at Lusail Stadium!" },
  { id: 2,  minute: 7,   type: "corner",        team: "home", detail: "Argentina win the first corner of the match." },
  { id: 3,  minute: 14,  type: "save",          team: "away", player: "H. Lloris", detail: "Great save by Lloris from Messi's curling effort." },
  { id: 4,  minute: 21,  type: "yellow",        team: "away", player: "O. Dembélé", detail: "Booked for a reckless challenge on Molina." },
  { id: 5,  minute: 23,  type: "goal",          team: "home", player: "L. Messi", assist: "Á. Di María", detail: "GOOOL! Messi converts the penalty coolly into the bottom corner. 1-0!" },
  { id: 6,  minute: 30,  type: "corner",        team: "away", detail: "France win a corner but it's cleared by Romero." },
  { id: 7,  minute: 36,  type: "goal",          team: "home", player: "Á. Di María", assist: "N. Molina", detail: "GOOOL! A stunning team goal — Di María finishes a lightning counter-attack. 2-0!" },
  { id: 8,  minute: 42,  type: "injury",        team: "away", player: "L. Hernández", detail: "Lucas Hernández is down injured and will be replaced." },
  { id: 9,  minute: 43,  type: "substitution",  team: "away", player: "M. Kolo Muani (on)", detail: "Kolo Muani replaces the injured Hernández." },
  { id: 10, minute: 45,  type: "half-time",     detail: "Half-time: Argentina 2 – 0 France. Argentina have been dominant." },
  { id: 11, minute: 52,  type: "corner",        team: "home", detail: "Argentina pressing for a third goal." },
  { id: 12, minute: 57,  type: "save",          team: "home", player: "E. Martínez", detail: "Martínez denies Mbappé with a reflex save." },
  { id: 13, minute: 64,  type: "substitution",  team: "away", player: "M. Thuram (on)", detail: "Thuram comes on as France look for a lifeline." },
  { id: 14, minute: 71,  type: "yellow",        team: "home", player: "N. Otamendi", detail: "Otamendi booked for time-wasting." },
  { id: 15, minute: 80,  type: "goal",          team: "away", player: "K. Mbappé", detail: "GOOAL! Mbappé scores from the penalty spot! Game on! 2-1!" },
  { id: 16, minute: 81,  type: "goal",          team: "away", player: "K. Mbappé", detail: "INCROYABLE! Mbappé volleys in just 97 seconds later! 2-2! The stadium erupts!" },
  { id: 17, minute: 85,  type: "var",           detail: "VAR check for a possible handball — no penalty given." },
  { id: 18, minute: 90,  type: "corner",        team: "home", detail: "Late corner for Argentina as we enter added time." },
  { id: 19, minute: 95,  type: "save",          team: "away", player: "H. Lloris", detail: "Lloris with a crucial save to force extra time!" },
  { id: 20, minute: 100, type: "yellow",        team: "away", player: "A. Griezmann", detail: "Griezmann booked for a tactical foul on Messi." },
  { id: 21, minute: 108, type: "goal",          team: "home", player: "L. Messi", detail: "MESSI SCORES! A scramble in the box and Messi pokes it in! 3-2!" },
  { id: 22, minute: 115, type: "yellow",        team: "home", player: "G. Montiel", detail: "Montiel cautioned for a handball." },
  { id: 23, minute: 118, type: "penalty",       team: "away", detail: "PENALTY! Handball by Montiel! Mbappé steps up…" },
  { id: 24, minute: 118, type: "goal",          team: "away", player: "K. Mbappé", detail: "HAT-TRICK! Mbappé completes his hat-trick from the spot! 3-3!" },
  { id: 25, minute: 120, type: "full-time",     detail: "Full-time after extra time: Argentina 3 – 3 France. Heading to penalties!" },
];

const FINAL_STATS: MatchStats = {
  possession: [54, 46],
  shots: [20, 10],
  shotsOnTarget: [8, 6],
  corners: [6, 3],
  fouls: [18, 21],
  yellowCards: [2, 3],
  redCards: [0, 0],
  xG: [2.84, 2.67],
  passes: [612, 518],
  passAccuracy: [87, 82],
  offsides: [2, 4],
};

const GROUP_C: StandingsRow[] = [
  { team: "Argentina",    flag: "🇦🇷", played: 3, won: 2, drawn: 0, lost: 1, gf: 5, ga: 2, points: 6 },
  { team: "Poland",       flag: "🇵🇱", played: 3, won: 1, drawn: 1, lost: 1, gf: 2, ga: 2, points: 4 },
  { team: "Mexico",       flag: "🇲🇽", played: 3, won: 1, drawn: 1, lost: 1, gf: 2, ga: 3, points: 4 },
  { team: "Saudi Arabia", flag: "🇸🇦", played: 3, won: 1, drawn: 0, lost: 2, gf: 3, ga: 5, points: 3 },
];

const GROUP_D: StandingsRow[] = [
  { team: "France",    flag: "🇫🇷", played: 3, won: 2, drawn: 0, lost: 1, gf: 6, ga: 3, points: 6 },
  { team: "Australia", flag: "🇦🇺", played: 3, won: 1, drawn: 0, lost: 2, gf: 3, ga: 4, points: 3 },
  { team: "Tunisia",   flag: "🇹🇳", played: 3, won: 1, drawn: 0, lost: 2, gf: 1, ga: 2, points: 3 },
  { team: "Denmark",   flag: "🇩🇰", played: 3, won: 0, drawn: 2, lost: 1, gf: 1, ga: 2, points: 2 },
];

/** Explanations for casual viewers who don't know football jargon */
const STAT_EXPLANATIONS: Record<string, string> = {
  xG: "Expected Goals (xG) measures the quality of chances created. Each shot gets a probability of being scored based on distance, angle, and type of assist. An xG of 2.5 means the average player would score about 2.5 goals from those exact chances.",
  possession: "Ball possession shows the percentage of time each team controlled the ball. Higher possession doesn't always mean better play, but usually indicates which team dictated the tempo.",
  passAccuracy: "Pass accuracy is the percentage of successful passes out of total attempted passes. It reflects a team's ability to maintain control and build attacks.",
  shotsOnTarget: "Shots on target are shots that would have gone into the goal if not saved by the goalkeeper. A better indicator of attacking threat than total shots.",
};

// ═══════════════════════════════════════════════════════════════════════════════
// ███ RULE-BASED / TEMPLATE SUMMARY GENERATOR ███
// ═══════════════════════════════════════════════════════════════════════════════

function generateRuleSummary(
  events: MatchEvent[],
  home: TeamInfo,
  away: TeamInfo,
  stats: MatchStats,
): string {
  const goals = events.filter((e) => e.type === "goal");
  const homeGoals = goals.filter((g) => g.team === "home");
  const awayGoals = goals.filter((g) => g.team === "away");
  const hScore = homeGoals.length;
  const aScore = awayGoals.length;

  const homeScorers = homeGoals.map((g) => `${g.player} (${g.minute}')`).join(", ");
  const awayScorers = awayGoals.map((g) => `${g.player} (${g.minute}')`).join(", ");
  const yellows = events.filter((e) => e.type === "yellow");
  const reds = events.filter((e) => e.type === "red");

  let s = `🏟️ MATCH SUMMARY\n\n`;
  s += `${home.flag} ${home.name} ${hScore} – ${aScore} ${away.name} ${away.flag}\n\n`;

  // Narrative opener
  if (hScore === aScore) s += "An absolutely thrilling encounter that ended level! ";
  else if (hScore > aScore) s += `${home.name} secured the victory in a pulsating contest! `;
  else s += `${away.name} emerged victorious after a dramatic match! `;

  // First half
  const fhGoals = goals.filter((g) => g.minute <= 45);
  if (fhGoals.length === 0) {
    s += "The first half was a cagey affair with neither side finding the breakthrough. ";
  } else {
    const fhH = fhGoals.filter((g) => g.team === "home").length;
    const fhA = fhGoals.filter((g) => g.team === "away").length;
    s += `The first half saw ${fhGoals.length} goal(s), `;
    if (fhH > fhA) s += `with ${home.name} dominating early on. `;
    else if (fhA > fhH) s += `with ${away.name} taking control. `;
    else s += "evenly split between the two sides. ";
  }

  // Second half
  const shGoals = goals.filter((g) => g.minute > 45 && g.minute <= 90);
  if (shGoals.length > 0) {
    s += `\n\nThe second half brought ${shGoals.length} more goal(s). `;
    const late = shGoals.filter((g) => g.minute >= 75);
    if (late.length > 0) {
      s += `Late drama arrived as ${late.map((g) => g.player).join(" and ")} found the net in the final stages! `;
    }
  }

  // Extra time
  const etGoals = goals.filter((g) => g.minute > 90);
  if (etGoals.length > 0) {
    s += `\n\nExtra time provided even more drama with ${etGoals.length} additional goal(s)! `;
    etGoals.forEach((g) => {
      s += `${g.player} scored in the ${g.minute}' minute. `;
    });
  }

  // Scorers
  s += "\n\n⚽ SCORERS:\n";
  if (homeScorers) s += `${home.flag} ${home.shortName}: ${homeScorers}\n`;
  if (awayScorers) s += `${away.flag} ${away.shortName}: ${awayScorers}\n`;

  // Stats
  s += "\n📊 KEY STATISTICS:\n";
  s += `Possession: ${stats.possession[0]}% – ${stats.possession[1]}%\n`;
  s += `xG: ${stats.xG[0].toFixed(2)} – ${stats.xG[1].toFixed(2)}\n`;
  s += `Shots: ${stats.shots[0]} – ${stats.shots[1]} (On target: ${stats.shotsOnTarget[0]} – ${stats.shotsOnTarget[1]})\n`;

  // Tactical insight
  const possDiff = Math.abs(stats.possession[0] - stats.possession[1]);
  if (possDiff > 10) {
    const dom = stats.possession[0] > stats.possession[1] ? home.name : away.name;
    s += `\n🧠 TACTICAL INSIGHT: ${dom} controlled the ball significantly with ${Math.max(...stats.possession)}% possession. `;
  }
  const xGDiff = Math.abs(stats.xG[0] - stats.xG[1]);
  if (xGDiff > 0.5) {
    const better = stats.xG[0] > stats.xG[1] ? home.name : away.name;
    s += `${better} created higher quality chances (xG: ${Math.max(...stats.xG).toFixed(2)}). `;
  }

  // Discipline
  if (yellows.length > 4) s += `\n\n🟡 A feisty affair with ${yellows.length} yellow cards shown. `;
  if (reds.length > 0) s += `🔴 ${reds.length} red card(s) were brandished! `;

  // Verdict
  s += "\n\n📝 VERDICT: ";
  if (hScore === aScore) {
    s += "A fair result given both teams' efforts. This match will be remembered for its incredible twists and turns!";
  } else {
    const winner = hScore > aScore ? home.name : away.name;
    s += `${winner} earned a well-deserved win. The match showcased the highest level of football!`;
  }

  return s;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ███ GOOGLE GEMINI AI SUMMARY GENERATOR (with retry & fallback) ███
// ═══════════════════════════════════════════════════════════════════════════════

function getGeminiApiKey(): string {
  return localStorage.getItem("GEMINI_API_KEY") || "";
}
function setGeminiApiKey(key: string) {
  localStorage.setItem("GEMINI_API_KEY", key.trim());
}

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_RETRIES = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseRetryDelay(body: string): number {
  try {
    const json = JSON.parse(body);
    const ri = json?.error?.details?.find((d: any) => d["@type"]?.includes("RetryInfo"));
    if (ri?.retryDelay) {
      const secs = parseInt(ri.retryDelay, 10);
      if (secs > 0) return secs;
    }
  } catch {
    /* ignore */
  }
  return 30;
}

type ProgressCb = (msg: string) => void;

async function generateGeminiSummary(
  events: MatchEvent[],
  home: TeamInfo,
  away: TeamInfo,
  stats: MatchStats,
  onProgress?: ProgressCb,
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini API key not configured.");

  const goals = events.filter((e) => e.type === "goal");
  const hGoals = goals.filter((g) => g.team === "home");
  const aGoals = goals.filter((g) => g.team === "away");

  const matchData = {
    homeTeam: { name: home.name, shortName: home.shortName, score: hGoals.length },
    awayTeam: { name: away.name, shortName: away.shortName, score: aGoals.length },
    events: events.map((e) => ({
      minute: e.minute,
      type: e.type,
      team: e.team,
      player: e.player,
      assist: e.assist,
      detail: e.detail,
    })),
    stats: {
      possession: `${stats.possession[0]}%–${stats.possession[1]}%`,
      xG: `${stats.xG[0].toFixed(2)}–${stats.xG[1].toFixed(2)}`,
      shots: `${stats.shots[0]}–${stats.shots[1]}`,
      shotsOnTarget: `${stats.shotsOnTarget[0]}–${stats.shotsOnTarget[1]}`,
    },
  };

  const prompt = `You are a professional football commentator and analyst. Write an engaging, dramatic match summary.

Match: ${home.name} vs ${away.name}
Final Score: ${hGoals.length} – ${aGoals.length}

Match Data (JSON):
${JSON.stringify(matchData, null, 2)}

Requirements:
- 150–200 words
- Exciting, professional sports-journalism tone
- Mention key moments, goals, and standout players
- Include tactical insights based on the stats
- A verdict at the end
- Emojis sparingly for section headers (⚽, 📊, 🏆, 🧠)
- Clear paragraphs`;

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 512, topP: 0.95 },
  });

  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      onProgress?.(`Trying ${model}${attempt > 0 ? ` (retry ${attempt}/${MAX_RETRIES})` : ""}…`);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("No text returned from Gemini API");
        return text;
      }

      const errText = await res.text();

      if (res.status === 429) {
        const delay = parseRetryDelay(errText);
        if (attempt < MAX_RETRIES) {
          for (let s = delay; s > 0; s--) {
            onProgress?.(`⏳ Rate limited – retrying ${model} in ${s}s…`);
            await sleep(1000);
          }
          continue;
        }
        break; // next model
      }

      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }
  }

  throw new Error(
    "All Gemini models are rate-limited. Please wait a minute and try again, or check your quota at https://ai.google.dev/gemini-api/docs/rate-limits",
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ███ SMALL REUSABLE COMPONENTS ███
// ═══════════════════════════════════════════════════════════════════════════════

function EventIcon({ type }: { type: MatchEvent["type"] }) {
  const icons: Record<string, string> = {
    goal: "⚽",
    yellow: "🟡",
    red: "🔴",
    substitution: "🔄",
    var: "📺",
    "half-time": "⏸️",
    "full-time": "🏁",
    kickoff: "▶️",
    penalty: "⚡",
    corner: "📐",
    injury: "🏥",
    save: "🧤",
  };
  return <span style={{ fontSize: 18 }}>{icons[type] || "•"}</span>;
}

function StatBar({
  label,
  homeVal,
  awayVal,
  format,
  explanation,
}: {
  label: string;
  homeVal: number;
  awayVal: number;
  format?: "pct" | "decimal" | "int";
  explanation?: string;
}) {
  const [showExplain, setShowExplain] = useState(false);
  const total = homeVal + awayVal || 1;
  const homePct = (homeVal / total) * 100;
  const fmt =
    format === "decimal"
      ? (v: number) => v.toFixed(2)
      : format === "pct"
        ? (v: number) => v + "%"
        : (v: number) => String(v);

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          marginBottom: 4,
          color: C.text,
        }}
      >
        <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(homeVal)}</span>
        <span
          style={{
            color: C.dim,
            display: "flex",
            alignItems: "center",
            gap: 4,
            cursor: explanation ? "pointer" : "default",
          }}
          onClick={() => explanation && setShowExplain(!showExplain)}
        >
          {label}{" "}
          {explanation && (
            <span
              style={{
                fontSize: 11,
                background: C.primary + "33",
                borderRadius: 4,
                padding: "1px 5px",
                color: C.primary,
              }}
            >
              ?
            </span>
          )}
        </span>
        <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(awayVal)}</span>
      </div>
      <div
        style={{
          display: "flex",
          height: 6,
          borderRadius: 3,
          overflow: "hidden",
          background: C.surface,
        }}
      >
        <div
          style={{
            width: `${homePct}%`,
            background: `linear-gradient(90deg, ${HOME_TEAM.color}, ${HOME_TEAM.color}cc)`,
            transition: "width 0.8s ease",
            borderRadius: "3px 0 0 3px",
          }}
        />
        <div
          style={{
            width: `${100 - homePct}%`,
            background: `linear-gradient(90deg, ${AWAY_TEAM.color}cc, ${AWAY_TEAM.color})`,
            transition: "width 0.8s ease",
            borderRadius: "0 3px 3px 0",
          }}
        />
      </div>
      {showExplain && explanation && (
        <div
          style={{
            marginTop: 8,
            padding: "10px 14px",
            borderRadius: 8,
            background: C.primary + "11",
            border: `1px solid ${C.primary}33`,
            fontSize: 12,
            color: C.dim,
            lineHeight: 1.6,
            animation: "mc-fadeIn .3s ease-out",
          }}
        >
          💡 {explanation}
        </div>
      )}
    </div>
  );
}

function StandingsTable({ title, rows }: { title: string; rows: StandingsRow[] }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: C.text }}>{title}</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
              {["#", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 6px",
                    textAlign: h === "Team" ? "left" : "center",
                    color: C.dim,
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.team}
                style={{
                  borderBottom: `1px solid ${C.surface}`,
                  background: i < 2 ? C.accent + "08" : "transparent",
                }}
              >
                <td
                  style={{
                    padding: "8px 6px",
                    textAlign: "center",
                    fontWeight: 700,
                    color: i < 2 ? C.accent : C.dim,
                  }}
                >
                  {i + 1}
                </td>
                <td style={{ padding: "8px 6px", fontWeight: 600, color: C.text }}>
                  <span style={{ marginRight: 6 }}>{r.flag}</span>
                  {r.team}
                </td>
                <td style={{ padding: "8px 6px", textAlign: "center" }}>{r.played}</td>
                <td style={{ padding: "8px 6px", textAlign: "center", color: C.accent }}>{r.won}</td>
                <td style={{ padding: "8px 6px", textAlign: "center" }}>{r.drawn}</td>
                <td style={{ padding: "8px 6px", textAlign: "center", color: C.red }}>{r.lost}</td>
                <td style={{ padding: "8px 6px", textAlign: "center" }}>{r.gf}</td>
                <td style={{ padding: "8px 6px", textAlign: "center" }}>{r.ga}</td>
                <td
                  style={{
                    padding: "8px 6px",
                    textAlign: "center",
                    fontWeight: 700,
                    color: r.gf - r.ga > 0 ? C.accent : r.gf - r.ga < 0 ? C.red : C.dim,
                  }}
                >
                  {r.gf - r.ga > 0 ? "+" : ""}
                  {r.gf - r.ga}
                </td>
                <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 800, color: C.gold }}>
                  {r.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: 2,
            background: C.accent,
            marginRight: 4,
            verticalAlign: "middle",
          }}
        />
        Qualified for knockout stage
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ███ MAIN COMPONENT — MatchdayCompanion ███
// ═══════════════════════════════════════════════════════════════════════════════

function MatchdayCompanion() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<MatchdayTab>("live");
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState(800);
  const [currentMinute, setCurrentMinute] = useState(0);
  const eventIndexRef = useRef(0);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const [favoriteTeam, setFavoriteTeam] = useState<"home" | "away" | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiProgress, setAiProgress] = useState<string | null>(null);
  const geminiTriggered = useRef(false);
  const [geminiKey, setGeminiKeyState] = useState(() => getGeminiApiKey());

  // ── Derived ────────────────────────────────────────────────────────────────
  const homeScore = events.filter((e) => e.type === "goal" && e.team === "home").length;
  const awayScore = events.filter((e) => e.type === "goal" && e.team === "away").length;
  const progress = (events.length / FULL_EVENTS.length) * 100;

  const interpStats: MatchStats = useMemo(() => {
    const pct = events.length / FULL_EVENTS.length;
    return {
      possession: [FINAL_STATS.possession[0], FINAL_STATS.possession[1]],
      shots: [Math.round(FINAL_STATS.shots[0] * pct), Math.round(FINAL_STATS.shots[1] * pct)],
      shotsOnTarget: [
        Math.round(FINAL_STATS.shotsOnTarget[0] * pct),
        Math.round(FINAL_STATS.shotsOnTarget[1] * pct),
      ],
      corners: [Math.round(FINAL_STATS.corners[0] * pct), Math.round(FINAL_STATS.corners[1] * pct)],
      fouls: [Math.round(FINAL_STATS.fouls[0] * pct), Math.round(FINAL_STATS.fouls[1] * pct)],
      yellowCards: [
        events.filter((e) => e.type === "yellow" && e.team === "home").length,
        events.filter((e) => e.type === "yellow" && e.team === "away").length,
      ],
      redCards: [
        events.filter((e) => e.type === "red" && e.team === "home").length,
        events.filter((e) => e.type === "red" && e.team === "away").length,
      ],
      xG: [+(FINAL_STATS.xG[0] * pct).toFixed(2), +(FINAL_STATS.xG[1] * pct).toFixed(2)],
      passes: [Math.round(FINAL_STATS.passes[0] * pct), Math.round(FINAL_STATS.passes[1] * pct)],
      passAccuracy: [FINAL_STATS.passAccuracy[0], FINAL_STATS.passAccuracy[1]],
      offsides: [Math.round(FINAL_STATS.offsides[0] * pct), Math.round(FINAL_STATS.offsides[1] * pct)],
    };
  }, [events]);

  const templateSummary = useMemo(
    () => generateRuleSummary(events, HOME_TEAM, AWAY_TEAM, interpStats),
    [events, interpStats],
  );

  // ── Simulation Controls ────────────────────────────────────────────────────
  const startSimulation = useCallback(() => {
    if (simRef.current) clearInterval(simRef.current);
    setIsSimulating(true);
    eventIndexRef.current = events.length;

    simRef.current = setInterval(() => {
      const idx = eventIndexRef.current;
      if (idx >= FULL_EVENTS.length) {
        if (simRef.current) clearInterval(simRef.current);
        setIsSimulating(false);
        return;
      }
      const next = FULL_EVENTS[idx];
      setEvents((prev) => [...prev, next]);
      setCurrentMinute(next.minute);
      eventIndexRef.current++;
    }, simSpeed);
  }, [events.length, simSpeed]);

  const stopSimulation = useCallback(() => {
    if (simRef.current) clearInterval(simRef.current);
    simRef.current = null;
    setIsSimulating(false);
  }, []);

  const resetSimulation = useCallback(() => {
    stopSimulation();
    setEvents([]);
    setCurrentMinute(0);
    eventIndexRef.current = 0;
    setAiSummary(null);
    setAiError(null);
    geminiTriggered.current = false;
  }, [stopSimulation]);

  const loadAll = useCallback(() => {
    stopSimulation();
    setEvents([...FULL_EVENTS]);
    setCurrentMinute(FULL_EVENTS[FULL_EVENTS.length - 1].minute);
    eventIndexRef.current = FULL_EVENTS.length;
  }, [stopSimulation]);

  // Cleanup on unmount
  useEffect(() => () => { if (simRef.current) clearInterval(simRef.current); }, []);

  // Auto-scroll live feed
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  // ── Gemini Summary ─────────────────────────────────────────────────────────
  const requestGeminiSummary = useCallback(async () => {
    if (events.length === 0) return;
    setAiLoading(true);
    setAiError(null);
    setAiProgress(null);
    try {
      const result = await generateGeminiSummary(events, HOME_TEAM, AWAY_TEAM, interpStats, (msg) =>
        setAiProgress(msg),
      );
      setAiSummary(result);
    } catch (e: any) {
      setAiError(e.message || "Failed to generate AI summary");
    } finally {
      setAiLoading(false);
      setAiProgress(null);
    }
  }, [events, interpStats]);

  // Auto-trigger when switching to summary tab
  useEffect(() => {
    if (tab === "summary" && events.length > 0 && !geminiTriggered.current && geminiKey) {
      geminiTriggered.current = true;
      requestGeminiSummary();
    }
    if (events.length === 0) geminiTriggered.current = false;
  }, [tab, events.length, requestGeminiSummary, geminiKey]);

  // ── Helper ─────────────────────────────────────────────────────────────────
  const tabBtn = (t: MatchdayTab, label: string, emoji: string) => (
    <button
      key={t}
      onClick={() => setTab(t)}
      style={{
        flex: 1,
        padding: "10px 8px",
        border: "none",
        borderBottom: tab === t ? `2px solid ${C.primary}` : "2px solid transparent",
        background: tab === t ? C.primary + "11" : "transparent",
        color: tab === t ? C.primary : C.dim,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: tab === t ? 700 : 500,
        fontFamily: "inherit",
        transition: "all .2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      <span>{emoji}</span> {label}
    </button>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "'Segoe UI','Helvetica Neue',Arial,sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: `linear-gradient(90deg, ${C.primary}, ${C.primaryDark})`,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>⚽ Matchday Companion</span>
        {isSimulating && (
          <span style={{ fontSize: 12, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#ff5252",
                animation: "mc-pulse 1s infinite",
              }}
            />
            LIVE {currentMinute}'
          </span>
        )}
      </div>

      {/* ── Scoreboard ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: C.scoreBg,
          padding: "20px 16px",
          borderBottom: `1px solid ${C.cardBorder}`,
        }}
      >
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {/* Home */}
          <div
            style={{ textAlign: "center", flex: 1, cursor: "pointer", opacity: favoriteTeam === "home" ? 1 : 0.8 }}
            onClick={() => setFavoriteTeam(favoriteTeam === "home" ? null : "home")}
          >
            <div style={{ fontSize: 40 }}>{HOME_TEAM.flag}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{HOME_TEAM.name}</div>
            {favoriteTeam === "home" && <span style={{ fontSize: 10, color: C.gold }}>⭐ Following</span>}
          </div>

          {/* Score */}
          <div
            style={{
              background: C.card,
              borderRadius: 14,
              padding: "12px 28px",
              border: `1px solid ${C.cardBorder}`,
              textAlign: "center",
              minWidth: 120,
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 900, fontVariantNumeric: "tabular-nums", letterSpacing: 2 }}>
              {homeScore} <span style={{ color: C.dim, fontSize: 24 }}>–</span> {awayScore}
            </div>
            <div
              style={{
                fontSize: 11,
                color: isSimulating ? C.red : C.dim,
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              {events.length === 0
                ? "PRE-MATCH"
                : isSimulating
                  ? `${currentMinute}' LIVE`
                  : events.length >= FULL_EVENTS.length
                    ? "FULL TIME (AET)"
                    : `${currentMinute}'`}
            </div>
          </div>

          {/* Away */}
          <div
            style={{ textAlign: "center", flex: 1, cursor: "pointer", opacity: favoriteTeam === "away" ? 1 : 0.8 }}
            onClick={() => setFavoriteTeam(favoriteTeam === "away" ? null : "away")}
          >
            <div style={{ fontSize: 40 }}>{AWAY_TEAM.flag}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{AWAY_TEAM.name}</div>
            {favoriteTeam === "away" && <span style={{ fontSize: 10, color: C.gold }}>⭐ Following</span>}
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            maxWidth: 600,
            margin: "12px auto 0",
            height: 3,
            borderRadius: 2,
            background: C.surface,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
              transition: "width .5s ease",
              borderRadius: 2,
            }}
          />
        </div>

        {/* Simulation controls */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {!isSimulating ? (
            <button
              onClick={startSimulation}
              disabled={events.length >= FULL_EVENTS.length}
              style={{
                padding: "6px 18px",
                borderRadius: 8,
                border: "none",
                fontWeight: 700,
                background:
                  events.length >= FULL_EVENTS.length
                    ? C.surface
                    : `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                color: events.length >= FULL_EVENTS.length ? C.dim : "#fff",
                cursor: events.length >= FULL_EVENTS.length ? "not-allowed" : "pointer",
                fontSize: 12,
                fontFamily: "inherit",
                opacity: events.length >= FULL_EVENTS.length ? 0.4 : 1,
              }}
            >
              ▶ {events.length === 0 ? "Start Simulation" : "Resume"}
            </button>
          ) : (
            <button
              onClick={stopSimulation}
              style={{
                padding: "6px 18px",
                borderRadius: 8,
                border: `1px solid ${C.primary}44`,
                background: "transparent",
                color: C.primary,
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "inherit",
                fontWeight: 700,
              }}
            >
              ⏸ Pause
            </button>
          )}
          <button
            onClick={loadAll}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: `1px solid ${C.cardBorder}`,
              background: "transparent",
              color: C.dim,
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            ⏩ Load All
          </button>
          <button
            onClick={resetSimulation}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: `1px solid ${C.cardBorder}`,
              background: "transparent",
              color: C.dim,
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            ↺ Reset
          </button>
          <select
            value={simSpeed}
            onChange={(e) => setSimSpeed(Number(e.target.value))}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${C.cardBorder}`,
              background: C.card,
              color: C.dim,
              fontSize: 12,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <option value={400}>Fast</option>
            <option value={800}>Normal</option>
            <option value={1500}>Slow</option>
            <option value={3000}>Realistic</option>
          </select>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${C.cardBorder}`,
          background: C.bg,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        {tabBtn("live", "Live", "📡")}
        {tabBtn("stats", "Stats", "📊")}
        {tabBtn("table", "Table", "📋")}
        {tabBtn("summary", "Summary", "🤖")}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {/* ────────────── LIVE TAB ────────────── */}
        {tab === "live" && (
          <div style={{ maxWidth: 650, margin: "0 auto" }}>
            {events.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: C.dim }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚽</div>
                <p style={{ fontSize: 15 }}>Press "Start Simulation" to begin the live match experience!</p>
                <p style={{ fontSize: 12, color: C.dim }}>Watch events unfold in real-time as the match progresses.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {events.map((evt, i) => {
                  const isGoal = evt.type === "goal";
                  const isSpecial = ["half-time", "full-time", "kickoff"].includes(evt.type);
                  const isNew = i === events.length - 1 && isSimulating;
                  const teamColor =
                    evt.team === "home" ? HOME_TEAM.color : evt.team === "away" ? AWAY_TEAM.color : C.dim;
                  const isHL = favoriteTeam && evt.team === favoriteTeam && alertsEnabled;

                  return (
                    <div
                      key={evt.id}
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: isGoal ? "14px 16px" : "10px 16px",
                        borderRadius: 10,
                        background: isGoal
                          ? "rgba(16,185,129,.08)"
                          : isSpecial
                            ? C.primary + "0a"
                            : isHL
                              ? C.gold + "08"
                              : C.card,
                        border: `1px solid ${isGoal ? C.accent + "33" : isHL ? C.gold + "33" : C.cardBorder}`,
                        animation: isNew ? "mc-slideIn .4s ease-out, mc-newEvt 2s ease-out" : undefined,
                      }}
                    >
                      <div
                        style={{
                          minWidth: 40,
                          textAlign: "center",
                          fontSize: 12,
                          fontWeight: 800,
                          color: isSpecial ? C.primary : teamColor,
                          paddingTop: 2,
                        }}
                      >
                        {isSpecial ? "—" : `${evt.minute}'`}
                      </div>
                      <EventIcon type={evt.type} />
                      <div style={{ flex: 1 }}>
                        {evt.player && (
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                            {evt.team === "home" ? HOME_TEAM.flag : evt.team === "away" ? AWAY_TEAM.flag : ""}{" "}
                            {evt.player}
                            {evt.assist && (
                              <span style={{ fontWeight: 400, color: C.dim }}> (assist: {evt.assist})</span>
                            )}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: isGoal ? 14 : 12,
                            color: isGoal ? C.accent : isSpecial ? C.primary : C.dim,
                            fontWeight: isGoal || isSpecial ? 600 : 400,
                            lineHeight: 1.5,
                          }}
                        >
                          {evt.detail}
                        </div>
                        {isGoal && (
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 13,
                              fontWeight: 800,
                              color: C.text,
                              background: C.scoreBg,
                              padding: "4px 12px",
                              borderRadius: 6,
                              display: "inline-block",
                            }}
                          >
                            {HOME_TEAM.shortName}{" "}
                            {events.filter((e) => e.type === "goal" && e.team === "home" && e.id <= evt.id).length}
                            {" – "}
                            {events.filter((e) => e.type === "goal" && e.team === "away" && e.id <= evt.id).length}{" "}
                            {AWAY_TEAM.shortName}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            )}
          </div>
        )}

        {/* ────────────── STATS TAB ────────────── */}
        {tab === "stats" && (
          <div style={{ maxWidth: 550, margin: "0 auto" }}>
            <div
              style={{
                background: C.card,
                borderRadius: 14,
                padding: 24,
                border: `1px solid ${C.cardBorder}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <span style={{ fontWeight: 700 }}>
                  {HOME_TEAM.flag} {HOME_TEAM.shortName}
                </span>
                <span style={{ color: C.dim, fontSize: 13, fontWeight: 600 }}>MATCH STATS</span>
                <span style={{ fontWeight: 700 }}>
                  {AWAY_TEAM.shortName} {AWAY_TEAM.flag}
                </span>
              </div>

              {events.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: C.dim }}>
                  Stats will appear once the match begins.
                </div>
              ) : (
                <>
                  <StatBar label="Possession" homeVal={interpStats.possession[0]} awayVal={interpStats.possession[1]} format="pct" explanation={STAT_EXPLANATIONS.possession} />
                  <StatBar label="Shots" homeVal={interpStats.shots[0]} awayVal={interpStats.shots[1]} />
                  <StatBar label="Shots on Target" homeVal={interpStats.shotsOnTarget[0]} awayVal={interpStats.shotsOnTarget[1]} explanation={STAT_EXPLANATIONS.shotsOnTarget} />
                  <StatBar label="xG" homeVal={interpStats.xG[0]} awayVal={interpStats.xG[1]} format="decimal" explanation={STAT_EXPLANATIONS.xG} />
                  <StatBar label="Corners" homeVal={interpStats.corners[0]} awayVal={interpStats.corners[1]} />
                  <StatBar label="Fouls" homeVal={interpStats.fouls[0]} awayVal={interpStats.fouls[1]} />
                  <StatBar label="Yellow Cards" homeVal={interpStats.yellowCards[0]} awayVal={interpStats.yellowCards[1]} />
                  <StatBar label="Red Cards" homeVal={interpStats.redCards[0]} awayVal={interpStats.redCards[1]} />
                  <StatBar label="Passes" homeVal={interpStats.passes[0]} awayVal={interpStats.passes[1]} />
                  <StatBar label="Pass Accuracy" homeVal={interpStats.passAccuracy[0]} awayVal={interpStats.passAccuracy[1]} format="pct" explanation={STAT_EXPLANATIONS.passAccuracy} />
                  <StatBar label="Offsides" homeVal={interpStats.offsides[0]} awayVal={interpStats.offsides[1]} />
                </>
              )}
            </div>
          </div>
        )}

        {/* ────────────── TABLE TAB ────────────── */}
        {tab === "table" && (
          <div style={{ maxWidth: 650, margin: "0 auto" }}>
            <div
              style={{
                background: C.card,
                borderRadius: 14,
                padding: 24,
                border: `1px solid ${C.cardBorder}`,
              }}
            >
              <StandingsTable title="Group C (Argentina's Group)" rows={GROUP_C} />
              <StandingsTable title="Group D (France's Group)" rows={GROUP_D} />
            </div>
          </div>
        )}

        {/* ────────────── SUMMARY TAB ────────────── */}
        {tab === "summary" && (
          <div style={{ maxWidth: 650, margin: "0 auto" }}>
            {/* Rule-based template summary */}
            <div
              style={{
                background: C.card,
                borderRadius: 14,
                padding: 24,
                border: `1px solid ${C.cardBorder}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>📝</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Template Summary</h3>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: C.dim + "22",
                    color: C.dim,
                    fontWeight: 600,
                  }}
                >
                  Rule-based
                </span>
              </div>
              {events.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: C.dim }}>
                  The summary will be generated as events unfold. Start the simulation to see it!
                </div>
              ) : (
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontFamily: "'Segoe UI', sans-serif",
                    fontSize: 13,
                    lineHeight: 1.8,
                    color: C.dim,
                    margin: 0,
                    background: C.surface,
                    borderRadius: 10,
                    padding: 20,
                  }}
                >
                  {templateSummary}
                </pre>
              )}
              {events.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={() => navigator.clipboard?.writeText(templateSummary)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: `1px solid ${C.cardBorder}`,
                      background: "transparent",
                      color: C.dim,
                      cursor: "pointer",
                      fontSize: 12,
                      fontFamily: "inherit",
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
              )}
            </div>

            {/* Gemini AI Summary */}
            <div
              style={{
                background: C.card,
                borderRadius: 14,
                padding: 24,
                marginTop: 16,
                border: `1px solid ${C.cardBorder}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>✨</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Gemini AI Summary</h3>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: "#4285f422",
                    color: "#4285f4",
                    fontWeight: 600,
                  }}
                >
                  Powered by Google Gemini
                </span>
              </div>

              {!geminiKey ? (
                /* ── API key input ── */
                <div
                  style={{
                    textAlign: "center",
                    padding: 24,
                    color: C.dim,
                    background: C.surface,
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔑</div>
                  <div style={{ fontSize: 13, marginBottom: 12 }}>
                    Enter your Gemini API Key to enable AI summaries.
                  </div>
                  <div style={{ fontSize: 12, marginBottom: 12 }}>
                    Get a free key at{" "}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#4285f4", textDecoration: "underline" }}
                    >
                      aistudio.google.com/apikey
                    </a>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "center",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      id="mc-gemini-key"
                      type="password"
                      placeholder="Paste your Gemini API key…"
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${C.cardBorder}`,
                        background: C.card,
                        color: C.text,
                        fontSize: 13,
                        fontFamily: "inherit",
                        width: 280,
                        outline: "none",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            setGeminiApiKey(val);
                            setGeminiKeyState(val);
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById("mc-gemini-key") as HTMLInputElement | null;
                        const val = input?.value.trim();
                        if (val) {
                          setGeminiApiKey(val);
                          setGeminiKeyState(val);
                        }
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "#4285f4",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "inherit",
                      }}
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              ) : events.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: C.dim }}>
                  Start the simulation first, then generate an AI-powered summary!
                </div>
              ) : aiSummary ? (
                <>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontFamily: "'Segoe UI', sans-serif",
                      fontSize: 13,
                      lineHeight: 1.8,
                      color: C.text,
                      margin: 0,
                      background: C.surface,
                      borderRadius: 10,
                      padding: 20,
                    }}
                  >
                    {aiSummary}
                  </pre>
                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => navigator.clipboard?.writeText(aiSummary)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: `1px solid ${C.cardBorder}`,
                        background: "transparent",
                        color: C.dim,
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "inherit",
                      }}
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={requestGeminiSummary}
                      disabled={aiLoading}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: `1px solid ${C.cardBorder}`,
                        background: "transparent",
                        color: C.dim,
                        cursor: aiLoading ? "wait" : "pointer",
                        fontSize: 12,
                        fontFamily: "inherit",
                      }}
                    >
                      🔄 Regenerate
                    </button>
                    {/* Clear key button */}
                    <button
                      onClick={() => {
                        setGeminiApiKey("");
                        setGeminiKeyState("");
                        setAiSummary(null);
                        geminiTriggered.current = false;
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: `1px solid ${C.cardBorder}`,
                        background: "transparent",
                        color: C.dim,
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "inherit",
                      }}
                    >
                      🔑 Change Key
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: 20 }}>
                  {aiError && (
                    <div
                      style={{
                        background: "#ef444422",
                        border: "1px solid #ef444444",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 16,
                        color: "#ef4444",
                        fontSize: 12,
                        textAlign: "left",
                      }}
                    >
                      ⚠️ {aiError}
                    </div>
                  )}
                  <button
                    onClick={requestGeminiSummary}
                    disabled={aiLoading}
                    style={{
                      padding: "12px 28px",
                      borderRadius: 10,
                      border: "none",
                      fontWeight: 700,
                      background: aiLoading ? C.dim : "linear-gradient(135deg, #4285f4, #34a853)",
                      color: "#ffffff",
                      cursor: aiLoading ? "wait" : "pointer",
                      fontSize: 14,
                      fontFamily: "inherit",
                      transition: "all .2s",
                      opacity: aiLoading ? 0.7 : 1,
                    }}
                  >
                    {aiLoading ? (
                      <span>{aiProgress || "⏳ Generating with Gemini…"}</span>
                    ) : (
                      <span>✨ Generate AI Summary with Gemini</span>
                    )}
                  </button>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>
                    Free • Powered by Google Gemini 2.0 Flash
                  </div>
                </div>
              )}
            </div>

            {/* Shareable match card */}
            {events.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  background: `linear-gradient(135deg, ${C.scoreBg}, ${C.card})`,
                  borderRadius: 14,
                  padding: 24,
                  border: `1px solid ${C.cardBorder}`,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: C.dim,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  📱 Shareable Match Card
                </div>
                <div
                  style={{
                    background: C.bg,
                    borderRadius: 12,
                    padding: "20px 24px",
                    display: "inline-block",
                    border: `1px solid ${C.cardBorder}`,
                    minWidth: 280,
                  }}
                >
                  <div style={{ fontSize: 11, color: C.primary, fontWeight: 700, marginBottom: 8 }}>
                    FIFA WORLD CUP 2022 — FINAL
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 28 }}>{HOME_TEAM.flag}</div>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{HOME_TEAM.shortName}</div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>
                      {homeScore} – {awayScore}
                    </div>
                    <div>
                      <div style={{ fontSize: 28 }}>{AWAY_TEAM.flag}</div>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{AWAY_TEAM.shortName}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 8 }}>
                    xG: {interpStats.xG[0].toFixed(2)} – {interpStats.xG[1].toFixed(2)} | Poss:{" "}
                    {interpStats.possession[0]}% – {interpStats.possession[1]}%
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Personalization Footer ─────────────────────────────────────────── */}
      <div
        style={{
          padding: "8px 16px",
          borderTop: `1px solid ${C.cardBorder}`,
          background: C.scoreBg,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: C.dim,
        }}
      >
        <span>
          {favoriteTeam
            ? `Following: ${favoriteTeam === "home" ? HOME_TEAM.name : AWAY_TEAM.name} ⭐`
            : "Tap a team to follow"}
        </span>
        <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={alertsEnabled}
            onChange={(e) => setAlertsEnabled(e.target.checked)}
            style={{ accentColor: C.primary }}
          />
          Highlight alerts
        </label>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ███ EXPORTED VIEW + FEATURE PAGE ███
// ═══════════════════════════════════════════════════════════════════════════════

export const MatchdayCompanionView = () => <MatchdayCompanion />;

@Feature({
  id: "matchday-Companion",
  label: "Matchday Companion",
  path: "/matchday-Companion",
  icon: "shell:soccer",
  description: "Live ticker, stats, standings & AI summaries for football matches",
  tags: ["football", "matchday", "live"],
  permissions: [],
  features: [],
  visibility: ["private", "public"],
})
export class MatchdayCompanionPage extends React.Component {
  static contextType = EnvironmentContext;
  declare context: Environment;

  render() {
    return <MatchdayCompanionView />;
  }
}