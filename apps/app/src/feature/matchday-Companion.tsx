import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { EnvironmentContext, Feature } from "@novx/portal";
import { Environment } from "@novx/core";

// ═══════════════════════════════════════════════════════════════════════════════
// ███ MATCHDAY COMPANION — Challenge 2 ███
// A lightweight matchday companion web app: live ticker, stats, standings,
// rule-based + Gemini AI summaries. Fully self-contained, no external sports API.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

type MatchdayTab = "live" | "stats" | "table" | "summary" | "pulse";

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

// ── Theme — Telekom Lovable Design ──────────────────────────────────────────

const C = {
  bg:           "#ffffff",
  bgSecondary:  "#f9f9f9",
  card:         "#ffffff",
  cardBorder:   "#e6e6e6",
  primary:      "#e20074",
  primaryDark:  "#b0005c",
  accent:       "#ff3399",
  gold:         "#e20074",
  red:          "#d90000",
  text:         "#191919",
  textSecondary:"#6c6c6c",
  dim:          "#999999",
  surface:      "#f2f2f2",
  scoreBg:      "#fafafa",
  magenta10:    "rgba(226,0,116,0.10)",
  magenta06:    "rgba(226,0,116,0.06)",
  magenta15:    "rgba(226,0,116,0.15)",
};

/** Telekom ODS type scale */
const ODS_FONT   = "'TeleNeoWeb', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const ODS_RADIUS = { sm: 4, md: 8, lg: 16 };
const ODS_SPACE  = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

// ── CSS Keyframes ───────────────────────────────────────────────────────────

const KEYFRAMES = `
@keyframes mc-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes mc-slideIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
@keyframes mc-newEvt  { from{background:rgba(226,0,116,.12)} to{background:transparent} }
@keyframes mc-fadeIn  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes mc-glow    { 0%,100%{box-shadow:0 0 8px rgba(226,0,116,.2)} 50%{box-shadow:0 0 24px rgba(226,0,116,.6)} }
@keyframes mc-breathe { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.15);opacity:1} }
@keyframes mc-waveBar { 0%{height:20%} 25%{height:80%} 50%{height:40%} 75%{height:90%} 100%{height:20%} }
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
// ███ MATCH PULSE — Emotion Graph, Crowd Noise, Momentum, Win-Probability ███
// ═══════════════════════════════════════════════════════════════════════════════

/** Compute an "excitement" score 0–100 for a single event */
function eventExcitement(evt: MatchEvent): number {
  const base: Record<string, number> = {
    goal: 100, penalty: 90, red: 75, var: 60, save: 50,
    "full-time": 55, "half-time": 30, yellow: 35, substitution: 15,
    injury: 40, corner: 20, kickoff: 45,
  };
  let v = base[evt.type] ?? 10;
  // late goals are even more exciting
  if (evt.type === "goal" && evt.minute >= 85) v = 100;
  if (evt.type === "goal" && evt.minute >= 75) v = Math.max(v, 95);
  return v;
}

/** Build cumulative excitement timeline from events */
function buildExcitementTimeline(events: MatchEvent[]): { minute: number; value: number; label: string }[] {
  if (events.length === 0) return [];
  let running = 20; // baseline "ambient" excitement
  return events.map((evt) => {
    const spike = eventExcitement(evt);
    // Blend: excitement decays but big events spike it up
    running = Math.min(100, Math.max(running * 0.7 + spike * 0.5, spike * 0.8));
    return {
      minute: evt.minute,
      value: Math.round(running),
      label: evt.type === "goal" ? `⚽ ${evt.player ?? "GOAL"}` : "",
    };
  });
}

/** Compute simple win probability from score + xG + possession */
function winProbability(
  hScore: number, aScore: number,
  hXG: number, aXG: number,
  hPoss: number, _aPoss: number,
  minute: number,
): { home: number; draw: number; away: number } {
  if (minute === 0) return { home: 0.33, draw: 0.34, away: 0.33 };
  const timeFactor = Math.min(minute / 120, 1); // how "locked in" is the score
  // Score dominance
  const scoreDiff = hScore - aScore;
  // xG quality bonus
  const xgDiff = (hXG - aXG) * 0.1;
  // possession bonus
  const possDiff = (hPoss - 50) * 0.003;

  const raw = scoreDiff * 0.3 * timeFactor + xgDiff * (1 - timeFactor * 0.5) + possDiff * (1 - timeFactor);
  // Sigmoid-ish transform
  const homeP = 1 / (1 + Math.exp(-raw * 2.5));
  const drawBoost = Math.max(0, 0.25 * (1 - Math.abs(scoreDiff) * 0.5) * (1 - timeFactor * 0.6));
  const h = Math.max(0.02, homeP - drawBoost / 2);
  const a = Math.max(0.02, 1 - homeP - drawBoost / 2);
  const d = Math.max(0.02, drawBoost);
  const total = h + a + d;
  return { home: h / total, draw: d / total, away: a / total };
}

/** Momentum: which team "owns" recent events */
function computeMomentum(events: MatchEvent[]): number {
  // Returns -100 (away dominant) to +100 (home dominant)
  if (events.length === 0) return 0;
  const recent = events.slice(-8);
  let m = 0;
  for (const e of recent) {
    const w = e.type === "goal" ? 40 : e.type === "save" ? 15 : e.type === "corner" ? 8 : e.type === "yellow" ? -5 : 3;
    if (e.team === "home") m += w;
    else if (e.team === "away") m -= w;
  }
  return Math.max(-100, Math.min(100, m));
}

// ── Crowd Noise Synthesizer (Web Audio API) ──────────────────────────────────

class CrowdNoiseEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private running = false;

  start() {
    if (this.running) return;
    try {
      this.ctx = new AudioContext();
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, sr * 4, sr);
      const data = buf.getChannelData(0);
      // Pink-ish noise: sounds like distant crowd murmur
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        b6 = white * 0.115926;
      }
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buf;
      this.noiseNode.loop = true;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.value = 800;

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0.15;

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      this.noiseNode.start();
      this.running = true;
    } catch {
      /* Web Audio not supported */
    }
  }

  stop() {
    try {
      this.noiseNode?.stop();
      this.ctx?.close();
    } catch { /* ignore */ }
    this.running = false;
    this.ctx = null;
    this.noiseNode = null;
  }

  /** React to an event type — spike volume & filter for drama */
  react(eventType: string) {
    if (!this.running || !this.gainNode || !this.filterNode || !this.ctx) return;
    const now = this.ctx.currentTime;
    const g = this.gainNode.gain;
    const f = this.filterNode.frequency;

    switch (eventType) {
      case "goal":
        // ROAR: loud, high frequency burst then sustain
        g.cancelScheduledValues(now);
        g.setValueAtTime(0.8, now);
        g.linearRampToValueAtTime(0.5, now + 0.3);
        g.linearRampToValueAtTime(0.35, now + 2);
        g.linearRampToValueAtTime(0.15, now + 5);
        f.setValueAtTime(2200, now);
        f.linearRampToValueAtTime(1200, now + 2);
        f.linearRampToValueAtTime(800, now + 5);
        // Haptic vibration
        try { navigator.vibrate?.([200, 100, 200, 100, 400]); } catch { /* noop */ }
        break;
      case "penalty":
      case "var":
        // Tense crowd: rising murmur
        g.cancelScheduledValues(now);
        g.setValueAtTime(0.3, now);
        g.linearRampToValueAtTime(0.45, now + 1);
        g.linearRampToValueAtTime(0.15, now + 4);
        f.setValueAtTime(600, now);
        f.linearRampToValueAtTime(1400, now + 1);
        f.linearRampToValueAtTime(800, now + 4);
        break;
      case "red":
      case "yellow":
        // Boos & whistles: mid burst
        g.cancelScheduledValues(now);
        g.setValueAtTime(0.4, now);
        g.linearRampToValueAtTime(0.15, now + 2);
        f.setValueAtTime(1800, now);
        f.linearRampToValueAtTime(800, now + 2);
        break;
      case "save":
        // Gasp then "ohhh"
        g.cancelScheduledValues(now);
        g.setValueAtTime(0.5, now);
        g.linearRampToValueAtTime(0.15, now + 1.5);
        f.setValueAtTime(1600, now);
        f.linearRampToValueAtTime(800, now + 1.5);
        break;
      case "half-time":
      case "full-time":
        // Whistle moment, then fade
        g.cancelScheduledValues(now);
        g.setValueAtTime(0.5, now);
        g.linearRampToValueAtTime(0.05, now + 3);
        break;
      default:
        // Gentle murmur bump
        g.cancelScheduledValues(now);
        g.setValueAtTime(Math.min(0.25, g.value + 0.05), now);
        g.linearRampToValueAtTime(0.15, now + 1);
        break;
    }
  }

  isRunning() { return this.running; }
}

// ── Excitement Graph Component (SVG) ─────────────────────────────────────────

function ExcitementGraph({
  timeline,
  currentMinute,
}: {
  timeline: { minute: number; value: number; label: string }[];
  currentMinute: number;
}) {
  const W = 600, H = 180, PAD = 30;
  const maxMin = Math.max(currentMinute, 90, ...timeline.map((t) => t.minute));

  const toX = (m: number) => PAD + ((m / maxMin) * (W - PAD * 2));
  const toY = (v: number) => H - PAD - ((v / 100) * (H - PAD * 2));

  // Build path
  let path = "";
  let areaPath = "";
  timeline.forEach((pt, i) => {
    const x = toX(pt.minute);
    const y = toY(pt.value);
    if (i === 0) {
      path = `M${x},${y}`;
      areaPath = `M${x},${H - PAD}L${x},${y}`;
    } else {
      // Smooth curve
      const prev = timeline[i - 1];
      const cx = (toX(prev.minute) + x) / 2;
      path += ` C${cx},${toY(prev.value)} ${cx},${y} ${x},${y}`;
      areaPath += ` C${cx},${toY(prev.value)} ${cx},${y} ${x},${y}`;
    }
  });
  if (timeline.length > 0) {
    const last = timeline[timeline.length - 1];
    areaPath += `L${toX(last.minute)},${H - PAD}Z`;
  }

  // Goal markers
  const goalPoints = timeline.filter((t) => t.label);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={PAD} y1={toY(v)} x2={W - PAD} y2={toY(v)} stroke={C.cardBorder} strokeWidth={0.5} />
          <text x={PAD - 4} y={toY(v) + 3} textAnchor="end" fontSize={9} fill={C.dim}>{v}</text>
        </g>
      ))}
      {/* Minute markers */}
      {[0, 15, 30, 45, 60, 75, 90, 105, 120].filter(m => m <= maxMin).map((m) => (
        <g key={m}>
          <line x1={toX(m)} y1={PAD} x2={toX(m)} y2={H - PAD} stroke={C.cardBorder} strokeWidth={0.5} strokeDasharray={m === 45 || m === 90 ? "4,2" : "none"} />
          <text x={toX(m)} y={H - PAD + 14} textAnchor="middle" fontSize={9} fill={C.dim}>{m}'</text>
        </g>
      ))}
      {/* Area fill */}
      {areaPath && (
        <path d={areaPath} fill="url(#excGrad)" opacity={0.3} />
      )}
      {/* Line */}
      {path && (
        <path d={path} fill="none" stroke={C.primary} strokeWidth={2.5} strokeLinecap="round" />
      )}
      {/* Goal markers */}
      {goalPoints.map((pt, i) => (
        <g key={i}>
          <circle cx={toX(pt.minute)} cy={toY(pt.value)} r={5} fill={C.primary} stroke="#fff" strokeWidth={2} />
          <text
            x={toX(pt.minute)}
            y={toY(pt.value) - 10}
            textAnchor="middle"
            fontSize={8}
            fontWeight={700}
            fill={C.text}
          >
            {pt.label}
          </text>
        </g>
      ))}
      {/* Gradient def */}
      <defs>
        <linearGradient id="excGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.primary} stopOpacity={0.6} />
          <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Axis labels */}
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={10} fill={C.dim}>Match Minute</text>
      <text x={4} y={H / 2} textAnchor="middle" fontSize={10} fill={C.dim} transform={`rotate(-90 4 ${H / 2})`}>
        Excitement
      </text>
    </svg>
  );
}

// ── Momentum Meter Component ─────────────────────────────────────────────────

function MomentumMeter({ value }: { value: number }) {
  // value: -100 (away) to +100 (home)
  const pct = ((value + 100) / 200) * 100; // 0–100
  const label = Math.abs(value) < 15 ? "Balanced" : value > 0 ? `${HOME_TEAM.shortName} Pushing` : `${AWAY_TEAM.shortName} Pushing`;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
        <span style={{ fontWeight: 700, color: HOME_TEAM.color }}>{HOME_TEAM.flag} {HOME_TEAM.shortName}</span>
        <span style={{ color: C.dim, fontWeight: 600 }}>⚡ {label}</span>
        <span style={{ fontWeight: 700, color: AWAY_TEAM.color }}>{AWAY_TEAM.shortName} {AWAY_TEAM.flag}</span>
      </div>
      <div style={{ position: "relative", height: 12, borderRadius: 6, overflow: "hidden", background: C.surface }}>
        {/* Home side */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${HOME_TEAM.color}44, ${HOME_TEAM.color})`,
          transition: "width 1s ease",
          borderRadius: "6px 0 0 6px",
        }} />
        {/* Needle */}
        <div style={{
          position: "absolute", left: `${pct}%`, top: -2, width: 3, height: 16,
          background: C.text, borderRadius: 2, transition: "left 1s ease",
          boxShadow: "0 0 6px rgba(0,0,0,.3)",
        }} />
      </div>
    </div>
  );
}

// ── Win Probability Bar ──────────────────────────────────────────────────────

function WinProbabilityBar({ prob }: { prob: { home: number; draw: number; away: number } }) {
  const fmt = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6, fontWeight: 700 }}>
        <span style={{ color: HOME_TEAM.color }}>{HOME_TEAM.flag} {fmt(prob.home)}</span>
        <span style={{ color: C.dim }}>🎲 Win Probability</span>
        <span style={{ color: AWAY_TEAM.color }}>{fmt(prob.away)} {AWAY_TEAM.flag}</span>
      </div>
      <div style={{ display: "flex", height: 20, borderRadius: 10, overflow: "hidden", fontSize: 10, fontWeight: 700 }}>
        <div style={{
          width: `${prob.home * 100}%`, background: HOME_TEAM.color,
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
          transition: "width 1s ease", minWidth: prob.home > 0.05 ? 30 : 0,
        }}>
          {prob.home >= 0.1 ? fmt(prob.home) : ""}
        </div>
        <div style={{
          width: `${prob.draw * 100}%`, background: C.dim,
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
          transition: "width 1s ease", minWidth: prob.draw > 0.05 ? 30 : 0,
        }}>
          {prob.draw >= 0.08 ? `Draw ${fmt(prob.draw)}` : ""}
        </div>
        <div style={{
          width: `${prob.away * 100}%`, background: AWAY_TEAM.color,
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
          transition: "width 1s ease", minWidth: prob.away > 0.05 ? 30 : 0,
        }}>
          {prob.away >= 0.1 ? fmt(prob.away) : ""}
        </div>
      </div>
    </div>
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

  const homeDominant = homeVal > awayVal;
  const awayDominant = awayVal > homeVal;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Label row — centered, tappable for explanation */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          minHeight: 28,
          cursor: explanation ? "pointer" : "default",
          WebkitTapHighlightColor: "transparent",
        }}
        onClick={() => explanation && setShowExplain(!showExplain)}
      >
        <span style={{
          fontSize: 12, fontWeight: 600, color: C.textSecondary,
          textTransform: "uppercase", letterSpacing: 0.5,
          fontFamily: ODS_FONT,
        }}>
          {label}
        </span>
        {explanation && (
          <span style={{
            width: 20, height: 20, borderRadius: "50%",
            background: C.magenta10, color: C.primary,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700,
          }}>
            ?
          </span>
        )}
      </div>

      {/* Values + bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
      }}>
        {/* Home value */}
        <span style={{
          minWidth: 44, textAlign: "right",
          fontSize: 16, fontWeight: 800, fontVariantNumeric: "tabular-nums",
          color: homeDominant ? HOME_TEAM.color : C.text,
          fontFamily: ODS_FONT,
        }}>
          {fmt(homeVal)}
        </span>

        {/* Bar */}
        <div style={{
          flex: 1, display: "flex", height: 10, borderRadius: 5,
          overflow: "hidden", background: C.surface,
        }}>
          <div style={{
            width: `${homePct}%`,
            background: homeDominant
              ? `linear-gradient(90deg, ${HOME_TEAM.color}, ${HOME_TEAM.color}dd)`
              : `${HOME_TEAM.color}88`,
            transition: "width 0.8s ease",
            borderRadius: "5px 0 0 5px",
          }} />
          <div style={{
            width: `${100 - homePct}%`,
            background: awayDominant
              ? `linear-gradient(90deg, ${AWAY_TEAM.color}dd, ${AWAY_TEAM.color})`
              : `${AWAY_TEAM.color}88`,
            transition: "width 0.8s ease",
            borderRadius: "0 5px 5px 0",
          }} />
        </div>

        {/* Away value */}
        <span style={{
          minWidth: 44, textAlign: "left",
          fontSize: 16, fontWeight: 800, fontVariantNumeric: "tabular-nums",
          color: awayDominant ? AWAY_TEAM.color : C.text,
          fontFamily: ODS_FONT,
        }}>
          {fmt(awayVal)}
        </span>
      </div>

      {/* Explanation overlay */}
      {showExplain && explanation && (
        <div style={{
          marginTop: 10, padding: "12px 16px", borderRadius: 10,
          background: C.magenta06, border: `1px solid ${C.magenta15}`,
          fontSize: 13, color: C.textSecondary, lineHeight: 1.7,
          animation: "mc-fadeIn .3s ease-out",
          fontFamily: ODS_FONT,
        }}>
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

  // ── Pulse / Crowd Noise state ──────────────────────────────────────────────
  const crowdRef = useRef<CrowdNoiseEngine | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const prevEventsLen = useRef(0);

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
  useEffect(() => () => {
    if (simRef.current) clearInterval(simRef.current);
    crowdRef.current?.stop();
  }, []);

  // Auto-scroll live feed
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  // ── Crowd Noise: react to new events ───────────────────────────────────────
  useEffect(() => {
    if (events.length > prevEventsLen.current && soundEnabled) {
      const newest = events[events.length - 1];
      if (!crowdRef.current) {
        crowdRef.current = new CrowdNoiseEngine();
        crowdRef.current.start();
      }
      crowdRef.current.react(newest.type);
    }
    prevEventsLen.current = events.length;
  }, [events, soundEnabled]);

  // Start/stop crowd noise engine based on toggle
  useEffect(() => {
    if (soundEnabled && !crowdRef.current?.isRunning()) {
      crowdRef.current = new CrowdNoiseEngine();
      crowdRef.current.start();
    } else if (!soundEnabled && crowdRef.current?.isRunning()) {
      crowdRef.current.stop();
      crowdRef.current = null;
    }
  }, [soundEnabled]);

  // ── Pulse derived data ─────────────────────────────────────────────────────
  const excitementTimeline = useMemo(() => buildExcitementTimeline(events), [events]);
  const momentum = useMemo(() => computeMomentum(events), [events]);
  const prob = useMemo(
    () => winProbability(homeScore, awayScore, interpStats.xG[0], interpStats.xG[1], interpStats.possession[0], interpStats.possession[1], currentMinute),
    [homeScore, awayScore, interpStats, currentMinute],
  );
  const currentExcitement = excitementTimeline.length > 0 ? excitementTimeline[excitementTimeline.length - 1].value : 0;

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
  const F = ODS_FONT;
  const mobileBtn: React.CSSProperties = {
    padding: "10px 16px", borderRadius: ODS_RADIUS.md, border: "none",
    fontWeight: 700, fontSize: 13, fontFamily: F, cursor: "pointer",
    WebkitTapHighlightColor: "transparent", minHeight: 44, // iOS touch target
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
  };

  return (
    <div
      style={{
        minHeight: "100vh", maxWidth: 480, margin: "0 auto", width: "100%",
        background: C.bg, color: C.text, fontFamily: F,
        display: "flex", flexDirection: "column",
        // safe-area for iPhone notch
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* ── App Header (compact mobile) ────────────────────────────────────── */}
      <div style={{
        background: C.primary, padding: "10px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: F }}>⚽ Matchday</span>
        {isSimulating && (
          <span style={{
            fontSize: 11, color: "#fff", display: "flex", alignItems: "center", gap: 4,
            background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "3px 10px",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", background: "#ff5252",
              animation: "mc-pulse 1s infinite",
            }} />
            LIVE {currentMinute}'
          </span>
        )}
      </div>

      {/* ── Scoreboard (mobile-optimized) ──────────────────────────────────── */}
      <div style={{
        background: C.bgSecondary, padding: "16px 12px 12px",
        borderBottom: `1px solid ${C.cardBorder}`,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          {/* Home team */}
          <div
            style={{
              textAlign: "center", flex: 1, cursor: "pointer",
              opacity: favoriteTeam === "home" ? 1 : 0.75,
              WebkitTapHighlightColor: "transparent",
            }}
            onClick={() => setFavoriteTeam(favoriteTeam === "home" ? null : "home")}
          >
            <div style={{ fontSize: 32 }}>{HOME_TEAM.flag}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, fontFamily: F }}>{HOME_TEAM.shortName}</div>
            {favoriteTeam === "home" && <div style={{ fontSize: 9, color: C.primary, marginTop: 1 }}>⭐</div>}
          </div>

          {/* Score */}
          <div style={{
            background: C.card, borderRadius: 12, padding: "8px 20px",
            border: `1px solid ${C.cardBorder}`, textAlign: "center", minWidth: 100,
          }}>
            <div style={{ fontSize: 32, fontWeight: 900, fontVariantNumeric: "tabular-nums", letterSpacing: 2, fontFamily: F }}>
              {homeScore} <span style={{ color: C.dim, fontSize: 20 }}>–</span> {awayScore}
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, marginTop: 1,
              color: isSimulating ? C.red : C.textSecondary,
            }}>
              {events.length === 0 ? "PRE-MATCH"
                : isSimulating ? `${currentMinute}' LIVE`
                : events.length >= FULL_EVENTS.length ? "FT (AET)" : `${currentMinute}'`}
            </div>
          </div>

          {/* Away team */}
          <div
            style={{
              textAlign: "center", flex: 1, cursor: "pointer",
              opacity: favoriteTeam === "away" ? 1 : 0.75,
              WebkitTapHighlightColor: "transparent",
            }}
            onClick={() => setFavoriteTeam(favoriteTeam === "away" ? null : "away")}
          >
            <div style={{ fontSize: 32 }}>{AWAY_TEAM.flag}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, fontFamily: F }}>{AWAY_TEAM.shortName}</div>
            {favoriteTeam === "away" && <div style={{ fontSize: 9, color: C.primary, marginTop: 1 }}>⭐</div>}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, borderRadius: 2, background: C.surface, overflow: "hidden", marginTop: 10 }}>
          <div style={{
            width: `${progress}%`, height: "100%", borderRadius: 2,
            background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
            transition: "width .5s ease",
          }} />
        </div>

        {/* Sim controls — horizontal scroll on small screens */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 6, marginTop: 10,
          overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2,
        }}>
          {!isSimulating ? (
            <button onClick={startSimulation} disabled={events.length >= FULL_EVENTS.length}
              style={{
                ...mobileBtn,
                background: events.length >= FULL_EVENTS.length ? C.surface : C.primary,
                color: events.length >= FULL_EVENTS.length ? C.dim : "#fff",
                opacity: events.length >= FULL_EVENTS.length ? 0.4 : 1,
              }}>
              ▶ {events.length === 0 ? "Start" : "Resume"}
            </button>
          ) : (
            <button onClick={stopSimulation}
              style={{ ...mobileBtn, background: "transparent", color: C.primary, border: `1.5px solid ${C.primary}` }}>
              ⏸ Pause
            </button>
          )}
          <button onClick={loadAll}
            style={{ ...mobileBtn, background: "transparent", color: C.textSecondary, border: `1px solid ${C.cardBorder}` }}>
            ⏩ All
          </button>
          <button onClick={resetSimulation}
            style={{ ...mobileBtn, background: "transparent", color: C.textSecondary, border: `1px solid ${C.cardBorder}` }}>
            ↺
          </button>
          <select value={simSpeed} onChange={(e) => setSimSpeed(Number(e.target.value))}
            style={{
              ...mobileBtn, background: C.card, color: C.textSecondary,
              border: `1px solid ${C.cardBorder}`, padding: "8px 10px",
            }}>
            <option value={400}>Fast</option>
            <option value={800}>Normal</option>
            <option value={1500}>Slow</option>
            <option value={3000}>Real</option>
          </select>
        </div>
      </div>

      {/* ── Tab Navigation (native app style bottom tabs) ──────────────────── */}
      <div style={{
        display: "flex", borderBottom: `1px solid ${C.cardBorder}`,
        background: C.bg, position: "sticky", top: 0, zIndex: 10,
      }}>
        {(["live", "stats", "table", "summary", "pulse"] as MatchdayTab[]).map((t) => {
          const icons: Record<MatchdayTab, string> = { live: "📡", stats: "📊", table: "📋", summary: "🤖", pulse: "💓" };
          const labels: Record<MatchdayTab, string> = { live: "Live", stats: "Stats", table: "Table", summary: "AI", pulse: "Pulse" };
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "8px 2px", border: "none",
              borderBottom: tab === t ? `2.5px solid ${C.primary}` : "2.5px solid transparent",
              background: tab === t ? C.magenta06 : "transparent",
              color: tab === t ? C.primary : C.dim,
              cursor: "pointer", fontSize: 10, fontWeight: tab === t ? 800 : 500,
              fontFamily: F, transition: "all .15s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
              WebkitTapHighlightColor: "transparent", minHeight: 44,
              justifyContent: "center",
            }}>
              <span style={{ fontSize: 16 }}>{icons[t]}</span>
              <span>{labels[t]}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 12px", WebkitOverflowScrolling: "touch" }}>
        {/* ────────────── LIVE TAB (Mobile) ────────────── */}
        {tab === "live" && (
          <div style={{ width: "100%" }}>
            {events.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: C.textSecondary }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>⚽</div>
                <p style={{ fontSize: 15, fontWeight: 600, fontFamily: F }}>Tap "Start" to begin!</p>
                <p style={{ fontSize: 13 }}>Events will appear in real-time.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {events.map((evt, i) => {
                  const isGoal = evt.type === "goal";
                  const isSpecial = ["half-time", "full-time", "kickoff"].includes(evt.type);
                  const isNew = i === events.length - 1 && isSimulating;
                  const teamColor = evt.team === "home" ? HOME_TEAM.color : evt.team === "away" ? AWAY_TEAM.color : C.dim;
                  const isHL = favoriteTeam && evt.team === favoriteTeam && alertsEnabled;

                  return (
                    <div key={evt.id} style={{
                      display: "flex", gap: 10,
                      padding: isGoal ? "14px 12px" : "10px 12px",
                      borderRadius: ODS_RADIUS.lg,
                      background: isGoal ? "rgba(16,185,129,.08)"
                        : isSpecial ? C.magenta06
                        : isHL ? C.magenta06 : C.card,
                      border: `1px solid ${isGoal ? C.accent + "33" : isHL ? C.primary + "33" : C.cardBorder}`,
                      animation: isNew ? "mc-slideIn .4s ease-out, mc-newEvt 2s ease-out" : undefined,
                    }}>
                      {/* Minute badge */}
                      <div style={{
                        minWidth: 36, textAlign: "center", fontSize: 11, fontWeight: 800,
                        color: isSpecial ? C.primary : teamColor, paddingTop: 2, fontFamily: F,
                      }}>
                        {isSpecial ? "—" : `${evt.minute}'`}
                      </div>
                      <EventIcon type={evt.type} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {evt.player && (
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2, fontFamily: F }}>
                            {evt.team === "home" ? HOME_TEAM.flag : evt.team === "away" ? AWAY_TEAM.flag : ""}{" "}
                            {evt.player}
                            {evt.assist && (
                              <span style={{ fontWeight: 400, color: C.dim, fontSize: 12 }}> ({evt.assist})</span>
                            )}
                          </div>
                        )}
                        <div style={{
                          fontSize: isGoal ? 14 : 13, lineHeight: 1.5,
                          color: isGoal ? C.accent : isSpecial ? C.primary : C.textSecondary,
                          fontWeight: isGoal || isSpecial ? 600 : 400,
                        }}>
                          {evt.detail}
                        </div>
                        {isGoal && (
                          <div style={{
                            marginTop: 6, fontSize: 14, fontWeight: 800, fontFamily: F,
                            color: C.text, background: C.bgSecondary,
                            padding: "5px 14px", borderRadius: 8, display: "inline-block",
                          }}>
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

        {/* ────────────── STATS TAB (Mobile-First) ────────────── */}
        {tab === "stats" && (
          <div style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>
            {/* Team header — sticky on mobile scroll */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 4px", marginBottom: 8,
              position: "sticky", top: 0, zIndex: 5,
              background: C.bg,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 24 }}>{HOME_TEAM.flag}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: HOME_TEAM.color, fontFamily: ODS_FONT }}>{HOME_TEAM.shortName}</span>
              </div>
              {events.length > 0 && (
                <div style={{
                  background: C.bgSecondary, borderRadius: 8, padding: "4px 14px",
                  border: `1px solid ${C.cardBorder}`,
                  fontSize: 18, fontWeight: 900, fontVariantNumeric: "tabular-nums",
                  color: C.text, fontFamily: ODS_FONT,
                }}>
                  {homeScore} – {awayScore}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: AWAY_TEAM.color, fontFamily: ODS_FONT }}>{AWAY_TEAM.shortName}</span>
                <span style={{ fontSize: 24 }}>{AWAY_TEAM.flag}</span>
              </div>
            </div>

            {events.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "48px 20px", color: C.textSecondary,
                fontFamily: ODS_FONT,
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                <p style={{ fontSize: 15, fontWeight: 600 }}>Waiting for kick-off…</p>
                <p style={{ fontSize: 13 }}>Stats will appear once the match begins.</p>
              </div>
            ) : (
              <>
                {/* ── Attack ── */}
                <div style={{
                  background: C.card, borderRadius: ODS_RADIUS.lg,
                  padding: "16px 16px 4px", marginBottom: 12,
                  border: `1px solid ${C.cardBorder}`,
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: C.primary,
                    textTransform: "uppercase", letterSpacing: 1,
                    marginBottom: 12, fontFamily: ODS_FONT,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span>⚽</span> Attack
                  </div>
                  <StatBar label="Shots" homeVal={interpStats.shots[0]} awayVal={interpStats.shots[1]} />
                  <StatBar label="Shots on Target" homeVal={interpStats.shotsOnTarget[0]} awayVal={interpStats.shotsOnTarget[1]} explanation={STAT_EXPLANATIONS.shotsOnTarget} />
                  <StatBar label="xG" homeVal={interpStats.xG[0]} awayVal={interpStats.xG[1]} format="decimal" explanation={STAT_EXPLANATIONS.xG} />
                  <StatBar label="Corners" homeVal={interpStats.corners[0]} awayVal={interpStats.corners[1]} />
                </div>

                {/* ── Possession & Passing ── */}
                <div style={{
                  background: C.card, borderRadius: ODS_RADIUS.lg,
                  padding: "16px 16px 4px", marginBottom: 12,
                  border: `1px solid ${C.cardBorder}`,
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: C.primary,
                    textTransform: "uppercase", letterSpacing: 1,
                    marginBottom: 12, fontFamily: ODS_FONT,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span>🎯</span> Possession & Passing
                  </div>
                  <StatBar label="Possession" homeVal={interpStats.possession[0]} awayVal={interpStats.possession[1]} format="pct" explanation={STAT_EXPLANATIONS.possession} />
                  <StatBar label="Passes" homeVal={interpStats.passes[0]} awayVal={interpStats.passes[1]} />
                  <StatBar label="Pass Accuracy" homeVal={interpStats.passAccuracy[0]} awayVal={interpStats.passAccuracy[1]} format="pct" explanation={STAT_EXPLANATIONS.passAccuracy} />
                  <StatBar label="Offsides" homeVal={interpStats.offsides[0]} awayVal={interpStats.offsides[1]} />
                </div>

                {/* ── Discipline ── */}
                <div style={{
                  background: C.card, borderRadius: ODS_RADIUS.lg,
                  padding: "16px 16px 4px", marginBottom: 12,
                  border: `1px solid ${C.cardBorder}`,
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: C.primary,
                    textTransform: "uppercase", letterSpacing: 1,
                    marginBottom: 12, fontFamily: ODS_FONT,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span>🟡</span> Discipline
                  </div>
                  <StatBar label="Fouls" homeVal={interpStats.fouls[0]} awayVal={interpStats.fouls[1]} />
                  <StatBar label="Yellow Cards" homeVal={interpStats.yellowCards[0]} awayVal={interpStats.yellowCards[1]} />
                  <StatBar label="Red Cards" homeVal={interpStats.redCards[0]} awayVal={interpStats.redCards[1]} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ────────────── TABLE TAB (Mobile) ────────────── */}
        {tab === "table" && (
          <div style={{ width: "100%" }}>
            <div style={{
              background: C.card, borderRadius: ODS_RADIUS.lg,
              padding: "12px 8px", border: `1px solid ${C.cardBorder}`,
            }}>
              <StandingsTable title="Group C (Argentina)" rows={GROUP_C} />
              <StandingsTable title="Group D (France)" rows={GROUP_D} />
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

        {/* ────────────── PULSE TAB ────────────── */}
        {tab === "pulse" && (
          <div style={{ maxWidth: 650, margin: "0 auto" }}>
            {events.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: C.dim }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💓</div>
                <p style={{ fontSize: 15 }}>Start the simulation to feel the match pulse!</p>
                <p style={{ fontSize: 12 }}>Excitement graph, crowd noise, momentum & win probability — all live.</p>
              </div>
            ) : (
              <>
                {/* Crowd Noise Toggle + Current Excitement */}
                <div style={{
                  background: C.card, borderRadius: 14, padding: 20,
                  border: `1px solid ${C.cardBorder}`, marginBottom: 16,
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Excitement Gauge */}
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%",
                      background: `conic-gradient(${C.primary} ${currentExcitement}%, ${C.surface} ${currentExcitement}%)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      animation: currentExcitement > 70 ? "mc-glow 1.5s infinite" : "none",
                    }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: "50%", background: C.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 900, color: C.primary,
                      }}>
                        {currentExcitement}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                        {currentExcitement >= 80 ? "🔥 ELECTRIC!" :
                         currentExcitement >= 60 ? "⚡ High Tension" :
                         currentExcitement >= 40 ? "📈 Building" :
                         currentExcitement >= 20 ? "😐 Quiet Spell" : "💤 Calm"}
                      </div>
                      <div style={{ fontSize: 11, color: C.dim }}>Match Excitement Level</div>
                    </div>
                  </div>

                  {/* Sound Toggle */}
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    style={{
                      padding: "8px 18px", borderRadius: 10, border: "none", fontWeight: 700,
                      background: soundEnabled
                        ? `linear-gradient(135deg, ${C.primary}, ${C.accent})`
                        : C.surface,
                      color: soundEnabled ? "#fff" : C.dim,
                      cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                      display: "flex", alignItems: "center", gap: 6,
                      transition: "all .2s",
                    }}
                  >
                    {soundEnabled ? (
                      <>
                        <span style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 14 }}>
                          {[0.4, 0.7, 1, 0.6].map((d, i) => (
                            <span key={i} style={{
                              width: 3, background: "#fff", borderRadius: 1,
                              animation: `mc-waveBar ${0.5 + d * 0.5}s ${i * 0.1}s ease-in-out infinite alternate`,
                            }} />
                          ))}
                        </span>
                        Crowd ON
                      </>
                    ) : (
                      <>🔇 Crowd OFF</>
                    )}
                  </button>
                </div>

                {/* Excitement Timeline Graph */}
                <div style={{
                  background: C.card, borderRadius: 14, padding: 20,
                  border: `1px solid ${C.cardBorder}`, marginBottom: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>📈</span>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Excitement Timeline</h3>
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 4,
                      background: C.primary + "22", color: C.primary, fontWeight: 600,
                    }}>Live</span>
                  </div>
                  <ExcitementGraph timeline={excitementTimeline} currentMinute={currentMinute} />
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 8, textAlign: "center" }}>
                    Goal moments marked with ⚽ — hover over the graph to explore
                  </div>
                </div>

                {/* Momentum Meter */}
                <div style={{
                  background: C.card, borderRadius: 14, padding: 20,
                  border: `1px solid ${C.cardBorder}`, marginBottom: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 18 }}>⚡</span>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Match Momentum</h3>
                  </div>
                  <MomentumMeter value={momentum} />
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>
                    Based on recent events — goals, saves, corners & cards in the last 8 events
                  </div>
                </div>

                {/* Win Probability */}
                <div style={{
                  background: C.card, borderRadius: 14, padding: 20,
                  border: `1px solid ${C.cardBorder}`, marginBottom: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 18 }}>🎲</span>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Win Probability</h3>
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 4,
                      background: C.dim + "22", color: C.dim, fontWeight: 600,
                    }}>Model</span>
                  </div>
                  <WinProbabilityBar prob={prob} />
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>
                    Calculated from score, xG, possession & match time. Updates live as events happen.
                  </div>
                </div>

                {/* Key Moments Heatstrip */}
                <div style={{
                  background: C.card, borderRadius: 14, padding: 20,
                  border: `1px solid ${C.cardBorder}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>🗺️</span>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Key Moments Heatstrip</h3>
                  </div>
                  <div style={{
                    display: "flex", height: 32, borderRadius: 6, overflow: "hidden",
                    background: C.surface, position: "relative",
                  }}>
                    {events.map((evt) => {
                      const maxMin = Math.max(currentMinute, 90);
                      const left = `${(evt.minute / maxMin) * 100}%`;
                      const isGoal = evt.type === "goal";
                      const isCard = evt.type === "yellow" || evt.type === "red";
                      const isPenalty = evt.type === "penalty";
                      const color = isGoal ? C.accent : isCard ? (evt.type === "red" ? C.red : "#f59e0b") : isPenalty ? "#8b5cf6" : C.dim + "44";
                      const h = isGoal ? 32 : isCard ? 22 : isPenalty ? 28 : 12;
                      return (
                        <div key={evt.id} title={`${evt.minute}' ${evt.type} ${evt.player || ""}`} style={{
                          position: "absolute", left, bottom: 0,
                          width: isGoal ? 4 : 3, height: h,
                          background: color, borderRadius: "2px 2px 0 0",
                          transition: "all .3s",
                          cursor: "pointer",
                        }} />
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.dim, marginTop: 4 }}>
                    <span>0'</span>
                    <span>45'</span>
                    <span>90'</span>
                    {currentMinute > 90 && <span>{currentMinute}'</span>}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 10, color: C.dim, flexWrap: "wrap" }}>
                    <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 1, background: C.accent, marginRight: 3, verticalAlign: "middle" }} />Goal</span>
                    <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 1, background: "#f59e0b", marginRight: 3, verticalAlign: "middle" }} />Yellow</span>
                    <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 1, background: C.red, marginRight: 3, verticalAlign: "middle" }} />Red</span>
                    <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 1, background: "#8b5cf6", marginRight: 3, verticalAlign: "middle" }} />Penalty</span>
                  </div>
                </div>
              </>
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