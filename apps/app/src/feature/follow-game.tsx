import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { EnvironmentContext, Feature } from '@novx/portal';
import { Environment } from '@novx/core';

// ═══════════════════════════════════════════════════════════════════════════════
// Top-level App Mode
// ═══════════════════════════════════════════════════════════════════════════════
type AppMode = "quiz" | "matchday";

// ═══════════════════════════════════════════════════════════════════════════════
// Types & Interfaces — Quiz
// ═══════════════════════════════════════════════════════════════════════════════

type Category   = "players" | "history" | "venues" | "statistics";
type GameMode   = "solo" | "duel" | "live-host";
type GamePhase  = "menu" | "category-select" | "playing" | "feedback" | "results" | "leaderboard";
type PowerUpType = "skip" | "double" | "fifty-fifty";

interface Question {
  id: number;
  category: Category;
  text: string;
  options: string[];
  correctIndex: number;
  difficulty: 1 | 2 | 3;
}

interface Player {
  name: string;
  score: number;
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  powerUps: Record<PowerUpType, number>;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  correct: number;
  total: number;
  mode: GameMode;
  date: string;
}

interface GlobalCorrectness {
  [questionId: number]: { correct: number; total: number };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const TIMER_SECONDS       = 15;
const QUESTIONS_PER_ROUND = 12;
const BASE_SCORE          = 100;
const TIME_BONUS_FACTOR   = 10;
const STREAK_BONUS        = 20;
const STORAGE_PREFIX      = "wcquiz_";
const MAX_LEADERBOARD     = 20;

const COLORS = {
  bg:        "#ffffff",
  bgCard:    "#fff0f6",
  primary:   "#e20074",
  primaryLt: "#ff3399",
  gold:      "#e20074",
  goldDark:  "#b0005c",
  white:     "#1a1a1a",
  dimWhite:  "#555555",
  correct:   "#43a047",
  wrong:     "#d32f2f",
  accent:    "#ff3399",
  danger:    "#ff5252",
  surface:   "rgba(226,0,116,0.06)",
  border:    "rgba(226,0,116,0.15)",
};

const CATEGORY_META: Record<Category, { label: string; emoji: string }> = {
  players:    { label: "Players",    emoji: "⚽" },
  history:    { label: "History",    emoji: "📜" },
  venues:     { label: "Venues",     emoji: "🏟️" },
  statistics: { label: "Statistics", emoji: "📊" },
};

const DIFFICULTY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Easy",   color: "#43a047" },
  2: { label: "Medium", color: "#ffa726" },
  3: { label: "Hard",   color: "#ef5350" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Question Pool (75 curated World Cup questions)
// ═══════════════════════════════════════════════════════════════════════════════

const QUESTIONS: Question[] = [
  // ── Players ────────────────────────────────────────────────────────────────
  { id:1,  category:"players", difficulty:1, text:"Who holds the record for most FIFA World Cup goals?", options:["Miroslav Klose","Ronaldo","Pelé","Gerd Müller"], correctIndex:0 },
  { id:2,  category:"players", difficulty:1, text:"Which player scored the 'Hand of God' goal?", options:["Diego Maradona","Pelé","Zinedine Zidane","Lionel Messi"], correctIndex:0 },
  { id:3,  category:"players", difficulty:2, text:"Who won the Golden Ball at the 2022 World Cup?", options:["Lionel Messi","Kylian Mbappé","Luka Modrić","Antoine Griezmann"], correctIndex:0 },
  { id:4,  category:"players", difficulty:2, text:"Which goalkeeper won the Golden Glove at the 2014 World Cup?", options:["Manuel Neuer","Tim Howard","Keylor Navas","Guillermo Ochoa"], correctIndex:0 },
  { id:5,  category:"players", difficulty:1, text:"Who scored a hat-trick in the 2022 World Cup final?", options:["Kylian Mbappé","Lionel Messi","Olivier Giroud","Julián Álvarez"], correctIndex:0 },
  { id:6,  category:"players", difficulty:3, text:"Who is the youngest player to score in a World Cup final?", options:["Pelé","Kylian Mbappé","Michael Owen","Ronaldo"], correctIndex:0 },
  { id:7,  category:"players", difficulty:2, text:"Who won the Golden Boot at the 2018 World Cup?", options:["Harry Kane","Antoine Griezmann","Romelu Lukaku","Kylian Mbappé"], correctIndex:0 },
  { id:8,  category:"players", difficulty:3, text:"Which player appeared in the most World Cup tournaments (5)?", options:["Antonio Carbajal & Lothar Matthäus","Gianluigi Buffon","Cristiano Ronaldo","Lionel Messi"], correctIndex:0 },
  { id:9,  category:"players", difficulty:1, text:"Who was sent off with a headbutt in the 2006 World Cup final?", options:["Zinedine Zidane","Marco Materazzi","Patrick Vieira","Thierry Henry"], correctIndex:0 },
  { id:10, category:"players", difficulty:2, text:"Who scored the fastest World Cup hat-trick in 2022?", options:["Gonçalo Ramos","Kylian Mbappé","Lionel Messi","Enner Valencia"], correctIndex:0 },
  { id:11, category:"players", difficulty:2, text:"Which Brazilian striker won the Golden Boot at the 2002 World Cup?", options:["Ronaldo","Rivaldo","Ronaldinho","Romário"], correctIndex:0 },
  { id:12, category:"players", difficulty:3, text:"Who is the oldest player to score in a World Cup match?", options:["Roger Milla","Cristiano Ronaldo","Miroslav Klose","Cuauhtémoc Blanco"], correctIndex:0 },
  { id:13, category:"players", difficulty:1, text:"Which player is known as 'O Rei' (The King)?", options:["Pelé","Ronaldo","Neymar","Garrincha"], correctIndex:0 },
  { id:14, category:"players", difficulty:2, text:"Who scored the winning goal in the 2010 World Cup final?", options:["Andrés Iniesta","David Villa","Xavi","Fernando Torres"], correctIndex:0 },
  { id:15, category:"players", difficulty:3, text:"Which player scored in every group stage match at the 1970 World Cup for Brazil?", options:["Jairzinho","Pelé","Tostão","Rivelino"], correctIndex:0 },

  // ── History ────────────────────────────────────────────────────────────────
  { id:16, category:"history", difficulty:1, text:"In which year was the first FIFA World Cup held?", options:["1930","1928","1934","1926"], correctIndex:0 },
  { id:17, category:"history", difficulty:1, text:"Which country won the first World Cup?", options:["Uruguay","Argentina","Brazil","Italy"], correctIndex:0 },
  { id:18, category:"history", difficulty:2, text:"Which was the first World Cup held in Asia?", options:["2002 (Korea/Japan)","2022 (Qatar)","2010 (South Africa)","1994 (USA)"], correctIndex:0 },
  { id:19, category:"history", difficulty:1, text:"How many times has Brazil won the World Cup?", options:["5","4","6","3"], correctIndex:0 },
  { id:20, category:"history", difficulty:2, text:"Which country won the 2018 World Cup?", options:["France","Croatia","Belgium","Brazil"], correctIndex:0 },
  { id:21, category:"history", difficulty:3, text:"Which World Cup was the first to use VAR (Video Assistant Referee)?", options:["2018 Russia","2014 Brazil","2022 Qatar","2010 South Africa"], correctIndex:0 },
  { id:22, category:"history", difficulty:2, text:"Who won the World Cup in 1966?", options:["England","West Germany","Brazil","Portugal"], correctIndex:0 },
  { id:23, category:"history", difficulty:1, text:"Which country won the 2022 FIFA World Cup?", options:["Argentina","France","Brazil","Croatia"], correctIndex:0 },
  { id:24, category:"history", difficulty:3, text:"What is the 'Miracle of Bern'?", options:["West Germany beating Hungary in 1954 final","Brazil winning 1970","Italy winning 2006","Uruguay winning 1950"], correctIndex:0 },
  { id:25, category:"history", difficulty:2, text:"Which was the first World Cup held in Africa?", options:["2010 South Africa","2014 Brazil","1998 France","2022 Qatar"], correctIndex:0 },
  { id:26, category:"history", difficulty:1, text:"The World Cup is held every how many years?", options:["4 years","2 years","3 years","5 years"], correctIndex:0 },
  { id:27, category:"history", difficulty:3, text:"In which World Cup did the 'Battle of Santiago' take place?", options:["1962 Chile","1966 England","1958 Sweden","1970 Mexico"], correctIndex:0 },
  { id:28, category:"history", difficulty:2, text:"Which team won the World Cup by winning all 7 matches in 2002?", options:["Brazil","Germany","France","Italy"], correctIndex:0 },
  { id:29, category:"history", difficulty:1, text:"Germany's highest World Cup victory was 7-1 against which team?", options:["Brazil","Argentina","South Korea","Saudi Arabia"], correctIndex:0 },
  { id:30, category:"history", difficulty:3, text:"Which country was banned from the 1950 World Cup due to WWII?", options:["Germany & Japan","Italy","Spain","Soviet Union"], correctIndex:0 },

  // ── Venues ─────────────────────────────────────────────────────────────────
  { id:31, category:"venues", difficulty:1, text:"In which country was the 2014 World Cup held?", options:["Brazil","Germany","South Africa","Russia"], correctIndex:0 },
  { id:32, category:"venues", difficulty:2, text:"What is the name of the iconic stadium in Rio de Janeiro?", options:["Maracanã","Camp Nou","Wembley","Azteca"], correctIndex:0 },
  { id:33, category:"venues", difficulty:1, text:"Where was the 2022 World Cup final played?", options:["Lusail Stadium, Qatar","Al Bayt Stadium","Khalifa International","Ahmad Bin Ali"], correctIndex:0 },
  { id:34, category:"venues", difficulty:2, text:"The 2018 World Cup final was played in which stadium?", options:["Luzhniki Stadium, Moscow","Saint Petersburg Stadium","Fisht Stadium","Kazan Arena"], correctIndex:0 },
  { id:35, category:"venues", difficulty:3, text:"Which stadium hosted both the 1970 and 1986 World Cup finals?", options:["Estadio Azteca, Mexico City","Maracanã","Wembley","Rose Bowl"], correctIndex:0 },
  { id:36, category:"venues", difficulty:1, text:"The 2026 World Cup will be hosted by which countries?", options:["USA, Canada & Mexico","USA & Brazil","England & Germany","Spain & Portugal"], correctIndex:0 },
  { id:37, category:"venues", difficulty:2, text:"Which city hosted the 1998 World Cup final?", options:["Paris (Stade de France)","Marseille","Lyon","Bordeaux"], correctIndex:0 },
  { id:38, category:"venues", difficulty:3, text:"What was the capacity of the Maracanã at the 1950 World Cup final?", options:["~200,000","~100,000","~150,000","~80,000"], correctIndex:0 },
  { id:39, category:"venues", difficulty:2, text:"The 2006 World Cup final was held in which German city?", options:["Berlin","Munich","Hamburg","Dortmund"], correctIndex:0 },
  { id:40, category:"venues", difficulty:1, text:"Which country hosted the 2010 World Cup?", options:["South Africa","Brazil","Germany","Japan"], correctIndex:0 },
  { id:41, category:"venues", difficulty:3, text:"The first World Cup final (1930) was played in which stadium?", options:["Estadio Centenario, Montevideo","Maracanã","Wembley","Olimpico"], correctIndex:0 },
  { id:42, category:"venues", difficulty:2, text:"Japan and South Korea co-hosted the World Cup in which year?", options:["2002","1998","2006","2010"], correctIndex:0 },
  { id:43, category:"venues", difficulty:2, text:"The 2034 World Cup is scheduled to be held in which country?", options:["Saudi Arabia","Australia","Morocco","Indonesia"], correctIndex:0 },
  { id:44, category:"venues", difficulty:3, text:"Which stadium hosted the 1994 World Cup final in the USA?", options:["Rose Bowl, Pasadena","MetLife Stadium","Cotton Bowl","Soldier Field"], correctIndex:0 },
  { id:45, category:"venues", difficulty:1, text:"Wembley Stadium is located in which city?", options:["London","Manchester","Liverpool","Birmingham"], correctIndex:0 },

  // ── Statistics ──────────────────────────────────────────────────────────────
  { id:46, category:"statistics", difficulty:1, text:"How many teams participate in the World Cup group stage (since 1998)?", options:["32","24","16","48"], correctIndex:0 },
  { id:47, category:"statistics", difficulty:2, text:"How many teams will participate in the 2026 World Cup?", options:["48","32","40","64"], correctIndex:0 },
  { id:48, category:"statistics", difficulty:1, text:"What is the most goals scored in a single World Cup match?", options:["12 (Austria 7-5 Switzerland, 1954)","11","10","9"], correctIndex:0 },
  { id:49, category:"statistics", difficulty:2, text:"Which country has appeared in the most World Cup tournaments?", options:["Brazil","Germany","Argentina","Italy"], correctIndex:0 },
  { id:50, category:"statistics", difficulty:3, text:"What is the fastest goal scored in World Cup history?", options:["10.8 seconds (Hakan Şükür, 2002)","15 seconds","8 seconds","23 seconds"], correctIndex:0 },
  { id:51, category:"statistics", difficulty:2, text:"How many red cards were shown at the 2006 World Cup?", options:["28","18","14","35"], correctIndex:0 },
  { id:52, category:"statistics", difficulty:1, text:"Which country has won the most World Cups?", options:["Brazil (5)","Germany (4)","Italy (4)","Argentina (3)"], correctIndex:0 },
  { id:53, category:"statistics", difficulty:3, text:"What was the total attendance at the 2022 Qatar World Cup?", options:["~3.4 million","~2.5 million","~4.0 million","~1.8 million"], correctIndex:0 },
  { id:54, category:"statistics", difficulty:2, text:"How many goals were scored at the 2022 World Cup?", options:["172","145","160","190"], correctIndex:0 },
  { id:55, category:"statistics", difficulty:1, text:"How many players are in a World Cup squad (since 2022)?", options:["26","23","25","30"], correctIndex:0 },
  { id:56, category:"statistics", difficulty:3, text:"What is the record for most World Cup goals by a single team in one tournament?", options:["27 (Hungary, 1954)","25","23","30"], correctIndex:0 },
  { id:57, category:"statistics", difficulty:2, text:"How many World Cup finals have gone to a penalty shootout?", options:["4","2","6","3"], correctIndex:0 },
  { id:58, category:"statistics", difficulty:1, text:"A standard football match lasts how many minutes?", options:["90 minutes","80 minutes","100 minutes","120 minutes"], correctIndex:0 },
  { id:59, category:"statistics", difficulty:3, text:"What was the average number of goals per game at the 2022 World Cup?", options:["2.69","2.35","3.01","2.15"], correctIndex:0 },
  { id:60, category:"statistics", difficulty:2, text:"The World Cup trophy weighs approximately how much?", options:["6.1 kg","3.8 kg","8.5 kg","11 kg"], correctIndex:0 },

  // ── Extra mixed ─────────────────────────────────────────────────────────────
  { id:61, category:"players", difficulty:2, text:"Which player won the World Cup as both a player and head coach?", options:["Franz Beckenbauer","Zinedine Zidane","Didier Deschamps","Mario Zagallo"], correctIndex:3 },
  { id:62, category:"history", difficulty:2, text:"Which team caused the biggest upset in World Cup 2022 by beating Argentina?", options:["Saudi Arabia","Japan","Australia","South Korea"], correctIndex:0 },
  { id:63, category:"statistics", difficulty:2, text:"How many own goals were scored at the 2018 World Cup, a record?", options:["12","8","6","15"], correctIndex:0 },
  { id:64, category:"players", difficulty:1, text:"Which Portuguese player holds the record for most international goals?", options:["Cristiano Ronaldo","Eusébio","Luís Figo","Nuno Gomes"], correctIndex:0 },
  { id:65, category:"history", difficulty:3, text:"Which country withdrew from the 1950 World Cup because FIFA refused to give them new boots?", options:["India","China","Turkey","Indonesia"], correctIndex:0 },
  { id:66, category:"venues", difficulty:2, text:"The 2030 World Cup will be hosted across how many continents?", options:["3 (Europe, Africa, South America)","2","1","4"], correctIndex:0 },
  { id:67, category:"statistics", difficulty:3, text:"What is the longest unbeaten streak at World Cups by any team?", options:["Brazil (13 matches, 2002-06)","Italy (13 matches)","Germany (15 matches)","France (12 matches)"], correctIndex:0 },
  { id:68, category:"players", difficulty:1, text:"Which French player won the Ballon d'Or and World Cup in 1998?", options:["Zinedine Zidane","Thierry Henry","Patrick Vieira","Didier Deschamps"], correctIndex:0 },
  { id:69, category:"history", difficulty:2, text:"Which was the first World Cup to feature goal-line technology?", options:["2014 Brazil","2018 Russia","2010 South Africa","2022 Qatar"], correctIndex:0 },
  { id:70, category:"venues", difficulty:3, text:"Which stadium has the largest capacity used for a World Cup match?", options:["Maracanã (1950)","Wembley (1966)","Estadio Azteca (1986)","Luzhniki (2018)"], correctIndex:0 },
  { id:71, category:"players", difficulty:3, text:"Who is the all-time top scorer in World Cup qualifying matches?", options:["Ali Daei","Cristiano Ronaldo","Sunil Chhetri","Carlos Ruiz"], correctIndex:1 },
  { id:72, category:"statistics", difficulty:1, text:"How many minutes is extra time in a knockout World Cup match?", options:["30 minutes (2x15)","20 minutes","15 minutes","40 minutes"], correctIndex:0 },
  { id:73, category:"history", difficulty:1, text:"Which team did Germany beat 7-1 in the 2014 World Cup semi-final?", options:["Brazil","Argentina","Netherlands","France"], correctIndex:0 },
  { id:74, category:"players", difficulty:2, text:"Who is the only player to win three World Cup winners' medals?", options:["Pelé","Cafu","Ronaldo","Garrincha"], correctIndex:0 },
  { id:75, category:"venues", difficulty:1, text:"Soccer City stadium is located in which country?", options:["South Africa","Brazil","USA","England"], correctIndex:0 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════════

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function calculateScore(
  difficulty: number,
  globalRate: number,
  timeRemaining: number,
  isDouble: boolean,
  streak: number,
): number {
  const diffMulti = difficulty;
  const rarityBonus = 1 + (1 - globalRate);
  const timeBonus = Math.round(timeRemaining * TIME_BONUS_FACTOR);
  const streakBonus = Math.max(0, (streak - 1)) * STREAK_BONUS;
  let score = Math.round(BASE_SCORE * diffMulti * rarityBonus) + timeBonus + streakBonus;
  if (isDouble) score *= 2;
  return score;
}

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + "leaderboard");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLeaderboard(entries: LeaderboardEntry[]) {
  localStorage.setItem(STORAGE_PREFIX + "leaderboard", JSON.stringify(entries.slice(0, MAX_LEADERBOARD)));
}

function loadGlobalCorrectness(): GlobalCorrectness {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + "correctness");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveGlobalCorrectness(data: GlobalCorrectness) {
  localStorage.setItem(STORAGE_PREFIX + "correctness", JSON.stringify(data));
}

function getGlobalRate(questionId: number, data: GlobalCorrectness): number {
  const entry = data[questionId];
  if (!entry || entry.total === 0) return 0.5;
  return entry.correct / entry.total;
}

function updateCorrectness(questionId: number, correct: boolean, data: GlobalCorrectness): GlobalCorrectness {
  const prev = data[questionId] ?? { correct: 0, total: 0 };
  return { ...data, [questionId]: { correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 } };
}

function makePlayer(name: string): Player {
  return { name, score: 0, correct: 0, wrong: 0, streak: 0, bestStreak: 0, powerUps: { skip: 1, double: 1, "fifty-fifty": 1 } };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSS Keyframes (injected once)
// ═══════════════════════════════════════════════════════════════════════════════

const CSS_KEYFRAMES = `
@keyframes wcq-fadeIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes wcq-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
@keyframes wcq-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
@keyframes wcq-confetti {
  0%{transform:translateY(0) rotate(0deg);opacity:1}
  100%{transform:translateY(420px) rotate(720deg);opacity:0}
}
@keyframes wcq-timerWarn { 0%,100%{color:#f44336} 50%{color:#ff8a65} }
@keyframes wcq-slideDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
@keyframes wcq-glow { 0%,100%{box-shadow:0 0 12px rgba(255,215,0,.3)} 50%{box-shadow:0 0 28px rgba(255,215,0,.7)} }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════════

function TimerCircle({ seconds, maxSeconds, isLive }: {
  seconds: number; maxSeconds: number; isRunning: boolean; onExpire: () => void; isLive: boolean;
}) {
  const radius = isLive ? 38 : 28;
  const stroke = 4;
  const circ = 2 * Math.PI * radius;
  const pct = seconds / maxSeconds;
  const offset = circ * (1 - pct);
  const warn = seconds <= 5 && seconds > 0;
  const sz = (radius + stroke) * 2;

  return (
    <div style={{ position: "relative", width: sz, height: sz, flexShrink: 0 }}>
      <svg width={sz} height={sz} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={radius + stroke} cy={radius + stroke} r={radius}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={radius + stroke} cy={radius + stroke} r={radius}
          fill="none"
          stroke={warn ? COLORS.danger : seconds > 10 ? COLORS.accent : COLORS.gold}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.3s linear, stroke 0.3s" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: isLive ? 26 : 18, fontWeight: 800, fontVariantNumeric: "tabular-nums",
        color: warn ? COLORS.danger : COLORS.white,
        animation: warn ? "wcq-timerWarn 0.5s ease-in-out infinite" : undefined,
      }}>
        {seconds}
      </div>
    </div>
  );
}

function PowerUpBar({ powerUps, onUse, disabled, isLive }: {
  powerUps: Record<PowerUpType, number>; onUse: (t: PowerUpType) => void; disabled: boolean; isLive: boolean;
}) {
  const items: { type: PowerUpType; emoji: string; label: string }[] = [
    { type: "skip",       emoji: "⏭️", label: "Skip" },
    { type: "double",     emoji: "✖️2", label: "2x Pts" },
    { type: "fifty-fifty", emoji: "½",  label: "50/50" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
      {items.map(it => {
        const used = powerUps[it.type] <= 0;
        return (
          <button key={it.type} disabled={disabled || used} onClick={() => onUse(it.type)}
            style={{
              padding: isLive ? "10px 20px" : "6px 14px",
              fontSize: isLive ? 18 : 13, fontWeight: 700, fontFamily: "inherit",
              border: `1px solid ${used ? "rgba(255,255,255,.08)" : COLORS.gold + "55"}`,
              borderRadius: 8, cursor: used || disabled ? "not-allowed" : "pointer",
              background: used ? "rgba(255,255,255,.03)" : "rgba(255,215,0,.08)",
              color: used ? "#555" : COLORS.gold, opacity: used ? 0.4 : 1,
              transition: "all .2s",
            }}>
            {it.emoji} {it.label} {!used && `(${powerUps[it.type]})`}
          </button>
        );
      })}
    </div>
  );
}

function CategorySelector({ selected, onToggle, isLive }: {
  selected: Set<Category>; onToggle: (c: Category) => void; isLive: boolean;
}) {
  const cats = Object.keys(CATEGORY_META) as Category[];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 420, margin: "0 auto" }}>
      {cats.map(c => {
        const meta = CATEGORY_META[c];
        const active = selected.has(c);
        return (
          <button key={c} onClick={() => onToggle(c)}
            style={{
              padding: isLive ? "20px 12px" : "16px 12px",
              borderRadius: 12,
              border: `2px solid ${active ? COLORS.gold : COLORS.border}`,
              background: active ? "rgba(255,215,0,.12)" : COLORS.surface,
              color: active ? COLORS.gold : COLORS.dimWhite,
              cursor: "pointer", fontSize: isLive ? 20 : 15, fontWeight: 700,
              fontFamily: "inherit", transition: "all .2s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            }}>
            <span style={{ fontSize: isLive ? 36 : 28 }}>{meta.emoji}</span>
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

function LeaderboardTable({ entries, highlightName, isLive }: {
  entries: LeaderboardEntry[]; highlightName?: string; isLive: boolean;
}) {
  if (!entries.length) return <div style={{ textAlign: "center", opacity: 0.5, padding: 20 }}>No entries yet. Be the first! 🏆</div>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isLive ? 18 : 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            {["#", "Name", "Score", "Accuracy", "Mode", "Date"].map(h => (
              <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: COLORS.dimWhite, fontWeight: 600, fontSize: isLive ? 16 : 11, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const hl = e.name === highlightName;
            return (
              <tr key={i} style={{ background: hl ? "rgba(255,215,0,.08)" : "transparent", borderBottom: `1px solid ${COLORS.surface}` }}>
                <td style={{ padding: "8px 10px", fontWeight: 800, color: i < 3 ? COLORS.gold : COLORS.dimWhite }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </td>
                <td style={{ padding: "8px 10px", fontWeight: hl ? 800 : 400, color: hl ? COLORS.gold : COLORS.white }}>{e.name}</td>
                <td style={{ padding: "8px 10px", fontWeight: 700, color: COLORS.accent }}>{e.score}</td>
                <td style={{ padding: "8px 10px" }}>{e.total > 0 ? Math.round(e.correct / e.total * 100) : 0}%</td>
                <td style={{ padding: "8px 10px", textTransform: "uppercase", fontSize: isLive ? 14 : 10, color: COLORS.dimWhite }}>{e.mode}</td>
                <td style={{ padding: "8px 10px", fontSize: isLive ? 14 : 10, color: COLORS.dimWhite }}>{e.date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 2,
      dur: 2 + Math.random() * 2,
      color: ["#ffd700", "#00e676", "#ff5252", "#2196f3", "#ff9800", "#e040fb"][i % 6],
      size: 6 + Math.random() * 8,
    })), []);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 10 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: "absolute", top: -20, left: `${p.left}%`,
          width: p.size, height: p.size * 0.6,
          background: p.color, borderRadius: 2,
          animation: `wcq-confetti ${p.dur}s ${p.delay}s ease-in forwards`,
        }} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ███ MATCHDAY COMPANION — Types, Data, Components ███
// ═══════════════════════════════════════════════════════════════════════════════

type MatchdayTab = "live" | "stats" | "table" | "summary";

interface MatchEvent {
  id: number;
  minute: number;
  type: "goal" | "yellow" | "red" | "substitution" | "var" | "half-time" | "full-time" | "kickoff" | "penalty" | "corner" | "injury" | "save";
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

// ── Matchday Constants ─────────────────────────────────────────────────────

const MD_COLORS = {
  bg: "#ffffff",
  card: "#fff0f6",
  cardBorder: "rgba(226,0,116,0.15)",
  primary: "#e20074",
  primaryDark: "#b0005c",
  accent: "#ff3399",
  gold: "#e20074",
  red: "#ef4444",
  white: "#1a1a1a",
  dim: "#777777",
  surface: "rgba(226,0,116,0.04)",
  scoreBg: "#fff5f9",
};

const HOME_TEAM: TeamInfo = { name: "Argentina", shortName: "ARG", flag: "🇦🇷", color: "#75aadb" };
const AWAY_TEAM: TeamInfo = { name: "France", shortName: "FRA", flag: "🇫🇷", color: "#003399" };

const FULL_EVENTS: MatchEvent[] = [
  { id: 1, minute: 0, type: "kickoff", detail: "The match has kicked off!" },
  { id: 2, minute: 7, type: "corner", team: "home", detail: "Argentina win the first corner of the match." },
  { id: 3, minute: 14, type: "save", team: "away", player: "Lloris", detail: "Great save by Lloris from Messi's curling effort." },
  { id: 4, minute: 21, type: "yellow", team: "away", player: "O. Dembélé", detail: "Booked for a reckless challenge on Molina." },
  { id: 5, minute: 23, type: "goal", team: "home", player: "L. Messi", assist: "Á. Di María", detail: "GOOOL! Messi converts the penalty coolly into the bottom corner. 1-0!" },
  { id: 6, minute: 30, type: "corner", team: "away", detail: "France win a corner but it's cleared by Romero." },
  { id: 7, minute: 36, type: "goal", team: "home", player: "Á. Di María", assist: "M. Molina", detail: "GOOOL! A stunning team goal! Di María finishes a lightning counter-attack. 2-0!" },
  { id: 8, minute: 42, type: "injury", team: "away", player: "L. Hernández", detail: "Lucas Hernández is down injured and will be replaced." },
  { id: 9, minute: 43, type: "substitution", team: "away", player: "M. Kolo Muani (on)", detail: "Kolo Muani replaces the injured Hernández." },
  { id: 10, minute: 45, type: "half-time", detail: "Half-time: Argentina 2 - 0 France. Argentina have been dominant." },
  { id: 11, minute: 52, type: "corner", team: "home", detail: "Argentina pressing for a third goal." },
  { id: 12, minute: 57, type: "save", team: "home", player: "E. Martínez", detail: "Martínez denies Mbappé with a reflex save." },
  { id: 13, minute: 64, type: "substitution", team: "away", player: "M. Thuram (on)", detail: "Thuram comes on as France look for a lifeline." },
  { id: 14, minute: 71, type: "yellow", team: "home", player: "N. Otamendi", detail: "Otamendi booked for time-wasting." },
  { id: 15, minute: 80, type: "goal", team: "away", player: "K. Mbappé", detail: "GOOAL! Mbappé scores from the penalty spot! Game on! 2-1!" },
  { id: 16, minute: 81, type: "goal", team: "away", player: "K. Mbappé", detail: "INCROYABLE! Mbappé volleys in just 97 seconds later! 2-2! The stadium erupts!" },
  { id: 17, minute: 85, type: "var", detail: "VAR check for a possible handball — no penalty given." },
  { id: 18, minute: 90, type: "corner", team: "home", detail: "Late corner for Argentina as we enter added time." },
  { id: 19, minute: 95, type: "save", team: "away", player: "Lloris", detail: "Lloris with a crucial save to force extra time!" },
  { id: 20, minute: 100, type: "yellow", team: "away", player: "A. Griezmann", detail: "Griezmann booked for a tactical foul on Messi." },
  { id: 21, minute: 108, type: "goal", team: "home", player: "L. Messi", detail: "MESSI SCORES! A scramble in the box and Messi pokes it in! 3-2!" },
  { id: 22, minute: 115, type: "yellow", team: "home", player: "G. Montiel", detail: "Montiel cautioned for a handball." },
  { id: 23, minute: 118, type: "penalty", team: "away", detail: "PENALTY! Handball by Montiel! Mbappé steps up..." },
  { id: 24, minute: 118, type: "goal", team: "away", player: "K. Mbappé", detail: "HAT-TRICK! Mbappé completes his hat-trick from the spot! 3-3!" },
  { id: 25, minute: 120, type: "full-time", detail: "Full-time after extra time: Argentina 3 - 3 France. Heading to penalties!" },
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

const GROUP_C_STANDINGS: StandingsRow[] = [
  { team: "Argentina",      flag: "🇦🇷", played: 3, won: 2, drawn: 0, lost: 1, gf: 5, ga: 2, points: 6 },
  { team: "Poland",         flag: "🇵🇱", played: 3, won: 1, drawn: 1, lost: 1, gf: 2, ga: 2, points: 4 },
  { team: "Mexico",         flag: "🇲🇽", played: 3, won: 1, drawn: 1, lost: 1, gf: 2, ga: 3, points: 4 },
  { team: "Saudi Arabia",   flag: "🇸🇦", played: 3, won: 1, drawn: 0, lost: 2, gf: 3, ga: 5, points: 3 },
];

const GROUP_D_STANDINGS: StandingsRow[] = [
  { team: "France",         flag: "🇫🇷", played: 3, won: 2, drawn: 0, lost: 1, gf: 6, ga: 3, points: 6 },
  { team: "Australia",      flag: "🇦🇺", played: 3, won: 1, drawn: 0, lost: 2, gf: 3, ga: 4, points: 3 },
  { team: "Tunisia",        flag: "🇹🇳", played: 3, won: 1, drawn: 0, lost: 2, gf: 1, ga: 2, points: 3 },
  { team: "Denmark",        flag: "🇩🇰", played: 3, won: 0, drawn: 2, lost: 1, gf: 1, ga: 2, points: 2 },
];

const STAT_EXPLANATIONS: Record<string, string> = {
  xG: "Expected Goals (xG) measures the quality of chances created. Each shot is assigned a probability of being scored based on factors like distance, angle, and type of assist. An xG of 2.5 means the average player would score about 2.5 goals from those exact chances.",
  possession: "Ball possession shows the percentage of time each team controlled the ball during the match. Higher possession doesn't always mean better play, but it usually indicates which team dictated the tempo.",
  passAccuracy: "Pass accuracy is the percentage of successful passes out of total attempted passes. It reflects a team's ability to maintain control and build attacks.",
  shotsOnTarget: "Shots on target are shots that would have gone into the goal if not saved by the goalkeeper. It's a better indicator of attacking threat than total shots.",
};

// ── AI Summary Generator (template-driven) ─────────────────────────────────

function generateMatchSummary(events: MatchEvent[], homeTeam: TeamInfo, awayTeam: TeamInfo, stats: MatchStats): string {
  const goals = events.filter(e => e.type === "goal");
  const homeGoals = goals.filter(g => g.team === "home");
  const awayGoals = goals.filter(g => g.team === "away");
  const homeScore = homeGoals.length;
  const awayScore = awayGoals.length;

  const homeScorers = homeGoals.map(g => `${g.player} (${g.minute}')`).join(", ");
  const awayScorers = awayGoals.map(g => `${g.player} (${g.minute}')`).join(", ");

  const yellows = events.filter(e => e.type === "yellow");
  const cards = events.filter(e => e.type === "red");

  let summary = `🏟️ MATCH SUMMARY\n\n`;
  summary += `${homeTeam.flag} ${homeTeam.name} ${homeScore} - ${awayScore} ${awayTeam.name} ${awayTeam.flag}\n\n`;

  // Opening narrative
  if (homeScore === awayScore) {
    summary += `An absolutely thrilling encounter that ended level! `;
  } else if (homeScore > awayScore) {
    summary += `${homeTeam.name} secured the victory in what was a pulsating contest! `;
  } else {
    summary += `${awayTeam.name} emerged victorious after a dramatic match! `;
  }

  // First half
  const firstHalfGoals = goals.filter(g => g.minute <= 45);
  if (firstHalfGoals.length === 0) {
    summary += `The first half was a cagey affair with neither side finding the breakthrough. `;
  } else {
    summary += `The first half saw ${firstHalfGoals.length} goal(s), `;
    const firstHalfHome = firstHalfGoals.filter(g => g.team === "home").length;
    const firstHalfAway = firstHalfGoals.filter(g => g.team === "away").length;
    if (firstHalfHome > firstHalfAway) {
      summary += `with ${homeTeam.name} dominating proceedings early on. `;
    } else if (firstHalfAway > firstHalfHome) {
      summary += `with ${awayTeam.name} taking control of the match. `;
    } else {
      summary += `evenly split between the two sides. `;
    }
  }

  // Second half drama
  const secondHalfGoals = goals.filter(g => g.minute > 45 && g.minute <= 90);
  if (secondHalfGoals.length > 0) {
    summary += `\n\nThe second half brought ${secondHalfGoals.length} more goal(s). `;
    const lateGoals = secondHalfGoals.filter(g => g.minute >= 75);
    if (lateGoals.length > 0) {
      summary += `Late drama arrived as ${lateGoals.map(g => g.player).join(" and ")} found the net in the final stages! `;
    }
  }

  // Extra time
  const etGoals = goals.filter(g => g.minute > 90);
  if (etGoals.length > 0) {
    summary += `\n\nExtra time provided even more drama with ${etGoals.length} additional goal(s)! `;
    etGoals.forEach(g => {
      summary += `${g.player} scored in the ${g.minute}th minute. `;
    });
  }

  // Scorers
  summary += `\n\n⚽ SCORERS:\n`;
  if (homeScorers) summary += `${homeTeam.flag} ${homeTeam.shortName}: ${homeScorers}\n`;
  if (awayScorers) summary += `${awayTeam.flag} ${awayTeam.shortName}: ${awayScorers}\n`;

  // Key stats
  summary += `\n📊 KEY STATISTICS:\n`;
  summary += `Possession: ${stats.possession[0]}% - ${stats.possession[1]}%\n`;
  summary += `xG: ${stats.xG[0].toFixed(2)} - ${stats.xG[1].toFixed(2)}\n`;
  summary += `Shots: ${stats.shots[0]} - ${stats.shots[1]} (On target: ${stats.shotsOnTarget[0]} - ${stats.shotsOnTarget[1]})\n`;

  // Tactical insight
  const possessionDiff = Math.abs(stats.possession[0] - stats.possession[1]);
  if (possessionDiff > 10) {
    const dominant = stats.possession[0] > stats.possession[1] ? homeTeam.name : awayTeam.name;
    summary += `\n🧠 TACTICAL INSIGHT: ${dominant} controlled the ball significantly with ${Math.max(...stats.possession)}% possession. `;
  }

  const xGDiff = Math.abs(stats.xG[0] - stats.xG[1]);
  if (xGDiff > 0.5) {
    const betterXG = stats.xG[0] > stats.xG[1] ? homeTeam.name : awayTeam.name;
    summary += `${betterXG} created higher quality chances (xG: ${Math.max(...stats.xG).toFixed(2)}). `;
  }

  // Discipline
  if (yellows.length > 4) {
    summary += `\n\n🟡 A feisty affair with ${yellows.length} yellow cards shown throughout. `;
  }
  if (cards.length > 0) {
    summary += `🔴 ${cards.length} red card(s) were brandished! `;
  }

  // Conclusion
  summary += `\n\n📝 VERDICT: `;
  if (homeScore === awayScore) {
    summary += `A fair result given both teams' efforts. This match will be remembered for its incredible twists and turns!`;
  } else {
    const winner = homeScore > awayScore ? homeTeam.name : awayTeam.name;
    summary += `${winner} earned a well-deserved win. The match showcased the highest level of football and will be talked about for years to come!`;
  }

  return summary;
}

// ── Google Gemini AI Summary Generator ──────────────────────────────────────

// API key is stored in localStorage at runtime – never hardcode it in source!
function getGeminiApiKey(): string {
  return localStorage.getItem("GEMINI_API_KEY") || "";
}
function setGeminiApiKey(key: string) {
  localStorage.setItem("GEMINI_API_KEY", key.trim());
}
// Ordered list of models to try – if one is rate-limited we fall back to the next
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_RETRIES = 2; // per model

/** Helper: sleep for `ms` milliseconds */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Extract retry-after seconds from a 429 error body (defaults to 30s) */
function parseRetryDelay(body: string): number {
  try {
    const json = JSON.parse(body);
    const retryInfo = json?.error?.details?.find((d: any) => d["@type"]?.includes("RetryInfo"));
    if (retryInfo?.retryDelay) {
      const secs = parseInt(retryInfo.retryDelay, 10);
      if (secs > 0) return secs;
    }
  } catch { /* ignore parse errors */ }
  return 30; // safe default
}

// Optional progress callback so the UI can show a countdown
type ProgressCallback = (msg: string) => void;

async function generateGeminiSummary(
  events: MatchEvent[],
  homeTeam: TeamInfo,
  awayTeam: TeamInfo,
  stats: MatchStats,
  onProgress?: ProgressCallback,
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key not configured. Get one free at https://aistudio.google.com/apikey");
  }

  const goals = events.filter(e => e.type === "goal");
  const homeGoals = goals.filter(g => g.team === "home");
  const awayGoals = goals.filter(g => g.team === "away");

  const matchData = {
    homeTeam: { name: homeTeam.name, shortName: homeTeam.shortName, score: homeGoals.length },
    awayTeam: { name: awayTeam.name, shortName: awayTeam.shortName, score: awayGoals.length },
    events: events.map(e => ({
      minute: e.minute, type: e.type, team: e.team,
      player: e.player, assist: e.assist, detail: e.detail,
    })),
    stats: {
      possession: `${stats.possession[0]}%-${stats.possession[1]}%`,
      xG: `${stats.xG[0].toFixed(2)}-${stats.xG[1].toFixed(2)}`,
      shots: `${stats.shots[0]}-${stats.shots[1]}`,
      shotsOnTarget: `${stats.shotsOnTarget[0]}-${stats.shotsOnTarget[1]}`,
    },
  };

  const prompt = `You are a professional football commentator and analyst. Write an engaging, dramatic match summary based on the following match data. 

Match: ${homeTeam.name} vs ${awayTeam.name}
Final Score: ${homeGoals.length} - ${awayGoals.length}

Match Data (JSON):
${JSON.stringify(matchData, null, 2)}

Requirements:
- Write 150-200 words
- Use an exciting, professional sports journalism tone
- Mention key moments, goals, and standout players
- Include tactical insights based on the stats
- Add a verdict at the end
- Use emojis sparingly for section headers (⚽, 📊, 🏆, 🧠)
- Format with clear paragraphs`;

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 512, topP: 0.95 },
  });

  // Try each model; within each model retry on 429
  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      onProgress?.(`Trying ${model}${attempt > 0 ? ` (retry ${attempt}/${MAX_RETRIES})` : ""}…`);
      console.log(`[Gemini] ${model} attempt ${attempt}`);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      console.log("[Gemini] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("No text returned from Gemini API");
        return text;
      }

      const errText = await response.text();

      // 429 = rate limited → wait & retry (or fall back to next model)
      if (response.status === 429) {
        const delaySecs = parseRetryDelay(errText);

        if (attempt < MAX_RETRIES) {
          // Countdown in the UI
          for (let s = delaySecs; s > 0; s--) {
            onProgress?.(`⏳ Rate limited – retrying ${model} in ${s}s…`);
            await sleep(1000);
          }
          continue; // retry same model
        }
        // Out of retries for this model → try next model
        console.warn(`[Gemini] ${model} exhausted retries, trying next model…`);
        break;
      }

      // Any other HTTP error is fatal
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }
  }

  throw new Error(
    "All Gemini models are rate-limited right now. Please wait a minute and try again, " +
    "or check your quota at https://ai.google.dev/gemini-api/docs/rate-limits"
  );
}

function EventIcon({ type }: { type: MatchEvent["type"] }) {
  const icons: Record<string, string> = {
    goal: "⚽", yellow: "🟡", red: "🔴", substitution: "🔄", var: "📺",
    "half-time": "⏸️", "full-time": "🏁", kickoff: "▶️", penalty: "⚡",
    corner: "📐", injury: "🏥", save: "🧤",
  };
  return <span style={{ fontSize: 18 }}>{icons[type] || "•"}</span>;
}

function StatBar({ label, homeVal, awayVal, format, explanation }: {
  label: string; homeVal: number; awayVal: number; format?: "pct" | "decimal" | "int"; explanation?: string;
}) {
  const [showExplain, setShowExplain] = useState(false);
  const total = homeVal + awayVal || 1;
  const homePct = (homeVal / total) * 100;
  const fmt = format === "decimal" ? (v: number) => v.toFixed(2) : format === "pct" ? (v: number) => v + "%" : (v: number) => String(v);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: MD_COLORS.white }}>
        <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(homeVal)}</span>
        <span style={{ color: MD_COLORS.dim, display: "flex", alignItems: "center", gap: 4, cursor: explanation ? "pointer" : "default" }}
          onClick={() => explanation && setShowExplain(!showExplain)}>
          {label} {explanation && <span style={{ fontSize: 11, background: MD_COLORS.primary + "33", borderRadius: 4, padding: "1px 5px", color: MD_COLORS.primary }}>?</span>}
        </span>
        <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(awayVal)}</span>
      </div>
      <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: MD_COLORS.surface }}>
        <div style={{ width: `${homePct}%`, background: `linear-gradient(90deg, ${HOME_TEAM.color}, ${HOME_TEAM.color}cc)`, transition: "width 0.8s ease", borderRadius: "3px 0 0 3px" }} />
        <div style={{ width: `${100 - homePct}%`, background: `linear-gradient(90deg, ${AWAY_TEAM.color}cc, ${AWAY_TEAM.color})`, transition: "width 0.8s ease", borderRadius: "0 3px 3px 0" }} />
      </div>
      {showExplain && explanation && (
        <div style={{
          marginTop: 8, padding: "10px 14px", borderRadius: 8,
          background: MD_COLORS.primary + "11", border: `1px solid ${MD_COLORS.primary}33`,
          fontSize: 12, color: MD_COLORS.dim, lineHeight: 1.6,
          animation: "wcq-fadeIn .3s ease-out",
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
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: MD_COLORS.white }}>{title}</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${MD_COLORS.cardBorder}` }}>
              {["#", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map(h => (
                <th key={h} style={{ padding: "8px 6px", textAlign: h === "Team" ? "left" : "center", color: MD_COLORS.dim, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.team} style={{
                borderBottom: `1px solid ${MD_COLORS.surface}`,
                background: i < 2 ? MD_COLORS.accent + "08" : "transparent",
              }}>
                <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700, color: i < 2 ? MD_COLORS.accent : MD_COLORS.dim }}>{i + 1}</td>
                <td style={{ padding: "8px 6px", fontWeight: 600, color: MD_COLORS.white }}>
                  <span style={{ marginRight: 6 }}>{r.flag}</span>{r.team}
                </td>
                <td style={{ padding: "8px 6px", textAlign: "center" }}>{r.played}</td>
                <td style={{ padding: "8px 6px", textAlign: "center", color: MD_COLORS.accent }}>{r.won}</td>
                <td style={{ padding: "8px 6px", textAlign: "center" }}>{r.drawn}</td>
                <td style={{ padding: "8px 6px", textAlign: "center", color: MD_COLORS.red }}>{r.lost}</td>
                <td style={{ padding: "8px 6px", textAlign: "center" }}>{r.gf}</td>
                <td style={{ padding: "8px 6px", textAlign: "center" }}>{r.ga}</td>
                <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700, color: (r.gf - r.ga) > 0 ? MD_COLORS.accent : (r.gf - r.ga) < 0 ? MD_COLORS.red : MD_COLORS.dim }}>
                  {(r.gf - r.ga) > 0 ? "+" : ""}{r.gf - r.ga}
                </td>
                <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 800, color: MD_COLORS.gold }}>{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: MD_COLORS.dim, marginTop: 6 }}>
        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: MD_COLORS.accent, marginRight: 4, verticalAlign: "middle" }} />
        Qualified for knockout stage
      </div>
    </div>
  );
}

// ── MatchdayCompanion Component ─────────────────────────────────────────────

function MatchdayCompanion({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<MatchdayTab>("live");
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState<number>(800);
  const [currentMinute, setCurrentMinute] = useState(0);
  const eventIndexRef = useRef(0);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const [favoriteTeam, setFavoriteTeam] = useState<"home" | "away" | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiProgress, setAiProgress] = useState<string | null>(null);
  const geminiTriggeredRef = useRef(false);
  const [geminiKey, setGeminiKey] = useState(() => getGeminiApiKey());

  const homeScore = events.filter(e => e.type === "goal" && e.team === "home").length;
  const awayScore = events.filter(e => e.type === "goal" && e.team === "away").length;

  // Simulate live events
  const startSimulation = useCallback(() => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setIsSimulating(true);
    eventIndexRef.current = events.length;

    simIntervalRef.current = setInterval(() => {
      const idx = eventIndexRef.current;
      if (idx >= FULL_EVENTS.length) {
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        setIsSimulating(false);
        return;
      }
      const nextEvent = FULL_EVENTS[idx];
      setEvents(prev => [...prev, nextEvent]);
      setCurrentMinute(nextEvent.minute);
      eventIndexRef.current++;
    }, simSpeed);
  }, [events.length, simSpeed]);

  const stopSimulation = useCallback(() => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    simIntervalRef.current = null;
    setIsSimulating(false);
  }, []);

  const resetSimulation = useCallback(() => {
    stopSimulation();
    setEvents([]);
    setCurrentMinute(0);
    eventIndexRef.current = 0;
    setAiSummary(null);
    setAiError(null);
    geminiTriggeredRef.current = false;
  }, [stopSimulation]);

  const loadAll = useCallback(() => {
    stopSimulation();
    setEvents([...FULL_EVENTS]);
    setCurrentMinute(FULL_EVENTS[FULL_EVENTS.length - 1].minute);
    eventIndexRef.current = FULL_EVENTS.length;
  }, [stopSimulation]);

  useEffect(() => {
    return () => { if (simIntervalRef.current) clearInterval(simIntervalRef.current); };
  }, []);

  // Auto-scroll
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);


  // Progress percentage
  const progress = events.length / FULL_EVENTS.length * 100;

  // Current interpolated stats
  const interpStats: MatchStats = useMemo(() => {
    const pct = events.length / FULL_EVENTS.length;
    // Just use final stats scaled by progress for realism
    return {
      possession: [FINAL_STATS.possession[0], FINAL_STATS.possession[1]],
      shots: [Math.round(FINAL_STATS.shots[0] * pct), Math.round(FINAL_STATS.shots[1] * pct)],
      shotsOnTarget: [Math.round(FINAL_STATS.shotsOnTarget[0] * pct), Math.round(FINAL_STATS.shotsOnTarget[1] * pct)],
      corners: [Math.round(FINAL_STATS.corners[0] * pct), Math.round(FINAL_STATS.corners[1] * pct)],
      fouls: [Math.round(FINAL_STATS.fouls[0] * pct), Math.round(FINAL_STATS.fouls[1] * pct)],
      yellowCards: [events.filter(e => e.type === "yellow" && e.team === "home").length, events.filter(e => e.type === "yellow" && e.team === "away").length],
      redCards: [events.filter(e => e.type === "red" && e.team === "home").length, events.filter(e => e.type === "red" && e.team === "away").length],
      xG: [+(FINAL_STATS.xG[0] * pct).toFixed(2), +(FINAL_STATS.xG[1] * pct).toFixed(2)],
      passes: [Math.round(FINAL_STATS.passes[0] * pct), Math.round(FINAL_STATS.passes[1] * pct)],
      passAccuracy: [FINAL_STATS.passAccuracy[0], FINAL_STATS.passAccuracy[1]],
      offsides: [Math.round(FINAL_STATS.offsides[0] * pct), Math.round(FINAL_STATS.offsides[1] * pct)],
    };
  }, [events]);

  const summary = useMemo(() => generateMatchSummary(events, HOME_TEAM, AWAY_TEAM, interpStats), [events, interpStats]);

  const requestGeminiSummary = useCallback(async () => {
    console.log("[Gemini] requestGeminiSummary called, events:", events.length, "apiKey:", !!getGeminiApiKey());
    if (events.length === 0) return;
    setAiLoading(true);
    setAiError(null);
    setAiProgress(null);
    try {
      const result = await generateGeminiSummary(events, HOME_TEAM, AWAY_TEAM, interpStats, (msg) => setAiProgress(msg));
      console.log("[Gemini] Success, got result:", result?.substring(0, 100));
      setAiSummary(result);
    } catch (e: any) {
      console.error("[Gemini] Error:", e);
      setAiError(e.message || "Failed to generate AI summary");
    } finally {
      setAiLoading(false);
      setAiProgress(null);
    }
  }, [events, interpStats]);

  // Auto-trigger Gemini when switching to summary tab with events
  useEffect(() => {
    if (tab === "summary" && events.length > 0 && !geminiTriggeredRef.current && geminiKey) {
      console.log("[Gemini] Auto-triggering summary generation");
      geminiTriggeredRef.current = true;
      requestGeminiSummary();
    }
    if (events.length === 0) {
      geminiTriggeredRef.current = false;
    }
  }, [tab, events.length, requestGeminiSummary]);

  const tabBtn = (t: MatchdayTab, label: string, emoji: string) => (
    <button key={t} onClick={() => setTab(t)}
      style={{
        flex: 1, padding: "10px 8px", border: "none", borderBottom: tab === t ? `2px solid ${MD_COLORS.primary}` : "2px solid transparent",
        background: tab === t ? MD_COLORS.primary + "11" : "transparent",
        color: tab === t ? MD_COLORS.primary : MD_COLORS.dim,
        cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 700 : 500, fontFamily: "inherit",
        transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
      }}>
      <span>{emoji}</span> {label}
    </button>
  );

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh", background: `linear-gradient(160deg, ${MD_COLORS.bg} 0%, #0c1425 50%, #0a1118 100%)`,
    color: MD_COLORS.white, fontFamily: "'Segoe UI','Helvetica Neue',Arial,sans-serif",
    display: "flex", flexDirection: "column",
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes md-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes md-slideIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes md-newEvent { from{background:rgba(59,130,246,.15)} to{background:transparent} }
        ${CSS_KEYFRAMES}
      `}</style>

      {/* Header */}
      <div style={{
        background: "rgba(0,0,0,.5)", borderBottom: `1px solid ${MD_COLORS.cardBorder}`,
        padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{
            background: "transparent", border: `1px solid ${MD_COLORS.cardBorder}`, color: MD_COLORS.dim,
            padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "inherit",
          }}>← Back</button>
          <span style={{
            fontSize: 15, fontWeight: 800,
            background: `linear-gradient(90deg, ${MD_COLORS.primary}, ${MD_COLORS.accent})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>⚽ Matchday Live</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isSimulating && (
            <span style={{ fontSize: 11, color: MD_COLORS.red, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: MD_COLORS.red, animation: "md-pulse 1s infinite" }} />
              LIVE {currentMinute}'
            </span>
          )}
        </div>
      </div>

      {/* Scoreboard */}
      <div style={{
        background: MD_COLORS.scoreBg, padding: "20px 16px",
        borderBottom: `1px solid ${MD_COLORS.cardBorder}`,
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <div style={{ textAlign: "center", flex: 1, cursor: "pointer", opacity: favoriteTeam === "home" ? 1 : 0.8 }}
            onClick={() => setFavoriteTeam(favoriteTeam === "home" ? null : "home")}>
            <div style={{ fontSize: 40 }}>{HOME_TEAM.flag}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{HOME_TEAM.name}</div>
            {favoriteTeam === "home" && <span style={{ fontSize: 10, color: MD_COLORS.gold }}>⭐ Following</span>}
          </div>
          <div style={{
            background: MD_COLORS.card, borderRadius: 14, padding: "12px 28px",
            border: `1px solid ${MD_COLORS.cardBorder}`, textAlign: "center", minWidth: 120,
          }}>
            <div style={{ fontSize: 36, fontWeight: 900, fontVariantNumeric: "tabular-nums", letterSpacing: 2 }}>
              {homeScore} <span style={{ color: MD_COLORS.dim, fontSize: 24 }}>-</span> {awayScore}
            </div>
            <div style={{ fontSize: 11, color: isSimulating ? MD_COLORS.red : MD_COLORS.dim, fontWeight: 600, marginTop: 2 }}>
              {events.length === 0 ? "PRE-MATCH" : isSimulating ? `${currentMinute}' LIVE` : events.length >= FULL_EVENTS.length ? "FULL TIME (AET)" : `${currentMinute}'`}
            </div>
          </div>
          <div style={{ textAlign: "center", flex: 1, cursor: "pointer", opacity: favoriteTeam === "away" ? 1 : 0.8 }}
            onClick={() => setFavoriteTeam(favoriteTeam === "away" ? null : "away")}>
            <div style={{ fontSize: 40 }}>{AWAY_TEAM.flag}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{AWAY_TEAM.name}</div>
            {favoriteTeam === "away" && <span style={{ fontSize: 10, color: MD_COLORS.gold }}>⭐ Following</span>}
          </div>
        </div>

        {/* Match progress bar */}
        <div style={{ maxWidth: 600, margin: "12px auto 0", height: 3, borderRadius: 2, background: MD_COLORS.surface, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${MD_COLORS.primary}, ${MD_COLORS.accent})`, transition: "width .5s ease", borderRadius: 2 }} />
        </div>

        {/* Simulation controls */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {!isSimulating ? (
            <button onClick={startSimulation} disabled={events.length >= FULL_EVENTS.length}
              style={{
                padding: "6px 18px", borderRadius: 8, border: "none", fontWeight: 700,
                background: events.length >= FULL_EVENTS.length ? MD_COLORS.surface : `linear-gradient(135deg, ${MD_COLORS.primary}, ${MD_COLORS.primaryDark})`,
                color: MD_COLORS.white, cursor: events.length >= FULL_EVENTS.length ? "not-allowed" : "pointer",
                fontSize: 12, fontFamily: "inherit", opacity: events.length >= FULL_EVENTS.length ? 0.4 : 1,
              }}>▶ {events.length === 0 ? "Start Simulation" : "Resume"}</button>
          ) : (
            <button onClick={stopSimulation}
              style={{
                padding: "6px 18px", borderRadius: 8, border: `1px solid ${MD_COLORS.gold}44`,
                background: "transparent", color: MD_COLORS.gold, cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 700,
              }}>⏸ Pause</button>
          )}
          <button onClick={loadAll}
            style={{
              padding: "6px 14px", borderRadius: 8, border: `1px solid ${MD_COLORS.cardBorder}`,
              background: "transparent", color: MD_COLORS.dim, cursor: "pointer", fontSize: 12, fontFamily: "inherit",
            }}>⏩ Load All</button>
          <button onClick={resetSimulation}
            style={{
              padding: "6px 14px", borderRadius: 8, border: `1px solid ${MD_COLORS.cardBorder}`,
              background: "transparent", color: MD_COLORS.dim, cursor: "pointer", fontSize: 12, fontFamily: "inherit",
            }}>↺ Reset</button>
          <select value={simSpeed} onChange={e => setSimSpeed(Number(e.target.value))}
            style={{
              padding: "6px 10px", borderRadius: 8, border: `1px solid ${MD_COLORS.cardBorder}`,
              background: MD_COLORS.card, color: MD_COLORS.dim, fontSize: 12, fontFamily: "inherit", cursor: "pointer",
            }}>
            <option value={400}>Fast</option>
            <option value={800}>Normal</option>
            <option value={1500}>Slow</option>
            <option value={3000}>Realistic</option>
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: "flex", borderBottom: `1px solid ${MD_COLORS.cardBorder}`,
        background: "rgba(0,0,0,.2)", position: "sticky", top: 0, zIndex: 10,
      }}>
        {tabBtn("live", "Live", "📡")}
        {tabBtn("stats", "Stats", "📊")}
        {tabBtn("table", "Table", "📋")}
        {tabBtn("summary", "Summary", "🤖")}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {tab === "live" && (
          <div style={{ maxWidth: 650, margin: "0 auto" }}>
            {events.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: MD_COLORS.dim }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚽</div>
                <p style={{ fontSize: 15 }}>Press "Start Simulation" to begin the live match experience!</p>
                <p style={{ fontSize: 12, color: MD_COLORS.dim }}>Watch events unfold in real-time as the match progresses.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {events.map((evt, i) => {
                  const isGoal = evt.type === "goal";
                  const isSpecial = ["half-time", "full-time", "kickoff"].includes(evt.type);
                  const isNew = i === events.length - 1 && isSimulating;
                  const teamColor = evt.team === "home" ? HOME_TEAM.color : evt.team === "away" ? AWAY_TEAM.color : MD_COLORS.dim;
                  const isHighlighted = favoriteTeam && evt.team === favoriteTeam && alertsEnabled;

                  return (
                    <div key={evt.id} style={{
                      display: "flex", gap: 12, padding: isGoal ? "14px 16px" : "10px 16px",
                      borderRadius: 10,
                      background: isGoal ? "rgba(16,185,129,.08)" : isSpecial ? MD_COLORS.primary + "0a" : isHighlighted ? MD_COLORS.gold + "08" : MD_COLORS.card,
                      border: `1px solid ${isGoal ? MD_COLORS.accent + "33" : isHighlighted ? MD_COLORS.gold + "33" : MD_COLORS.cardBorder}`,
                      animation: isNew ? "md-slideIn .4s ease-out, md-newEvent 2s ease-out" : undefined,
                    }}>
                      <div style={{
                        minWidth: 40, textAlign: "center", fontSize: 12, fontWeight: 800,
                        color: isSpecial ? MD_COLORS.primary : teamColor,
                        paddingTop: 2,
                      }}>
                        {isSpecial ? "—" : `${evt.minute}'`}
                      </div>
                      <EventIcon type={evt.type} />
                      <div style={{ flex: 1 }}>
                        {evt.player && (
                          <div style={{ fontSize: 13, fontWeight: 700, color: MD_COLORS.white, marginBottom: 2 }}>
                            {evt.team === "home" ? HOME_TEAM.flag : evt.team === "away" ? AWAY_TEAM.flag : ""} {evt.player}
                            {evt.assist && <span style={{ fontWeight: 400, color: MD_COLORS.dim }}> (assist: {evt.assist})</span>}
                          </div>
                        )}
                        <div style={{
                          fontSize: isGoal ? 14 : 12, color: isGoal ? MD_COLORS.accent : isSpecial ? MD_COLORS.primary : MD_COLORS.dim,
                          fontWeight: isGoal || isSpecial ? 600 : 400, lineHeight: 1.5,
                        }}>
                          {evt.detail}
                        </div>
                        {isGoal && (
                          <div style={{
                            marginTop: 6, fontSize: 13, fontWeight: 800, color: MD_COLORS.white,
                            background: MD_COLORS.scoreBg, padding: "4px 12px", borderRadius: 6, display: "inline-block",
                          }}>
                            {HOME_TEAM.shortName} {events.filter(e => e.type === "goal" && e.team === "home" && e.id <= evt.id).length}
                            {" - "}
                            {events.filter(e => e.type === "goal" && e.team === "away" && e.id <= evt.id).length} {AWAY_TEAM.shortName}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={eventsEndRef} />
              </div>
            )}
          </div>
        )}

        {tab === "stats" && (
          <div style={{ maxWidth: 550, margin: "0 auto" }}>
            <div style={{
              background: MD_COLORS.card, borderRadius: 14, padding: 24,
              border: `1px solid ${MD_COLORS.cardBorder}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <span style={{ fontWeight: 700 }}>{HOME_TEAM.flag} {HOME_TEAM.shortName}</span>
                <span style={{ color: MD_COLORS.dim, fontSize: 13, fontWeight: 600 }}>MATCH STATS</span>
                <span style={{ fontWeight: 700 }}>{AWAY_TEAM.shortName} {AWAY_TEAM.flag}</span>
              </div>

              {events.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: MD_COLORS.dim }}>
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

        {tab === "table" && (
          <div style={{ maxWidth: 650, margin: "0 auto" }}>
            <div style={{
              background: MD_COLORS.card, borderRadius: 14, padding: 24,
              border: `1px solid ${MD_COLORS.cardBorder}`,
            }}>
              <StandingsTable title="Group C (Argentina's Group)" rows={GROUP_C_STANDINGS} />
              <StandingsTable title="Group D (France's Group)" rows={GROUP_D_STANDINGS} />
            </div>
          </div>
        )}

        {tab === "summary" && (
          <div style={{ maxWidth: 650, margin: "0 auto" }}>
            {/* Template-based summary */}
            <div style={{
              background: MD_COLORS.card, borderRadius: 14, padding: 24,
              border: `1px solid ${MD_COLORS.cardBorder}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>📝</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Template Summary</h3>
                <span style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 4,
                  background: MD_COLORS.dim + "22", color: MD_COLORS.dim, fontWeight: 600,
                }}>Rule-based</span>
              </div>
              {events.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: MD_COLORS.dim }}>
                  The summary will be generated as events unfold. Start the simulation to see it!
                </div>
              ) : (
                <pre style={{
                  whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "'Segoe UI', sans-serif",
                  fontSize: 13, lineHeight: 1.8, color: MD_COLORS.dim, margin: 0,
                  background: MD_COLORS.surface, borderRadius: 10, padding: 20,
                }}>
                  {summary}
                </pre>
              )}
              {events.length > 0 && (
                <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => { navigator.clipboard?.writeText(summary); }}
                    style={{
                      padding: "8px 16px", borderRadius: 8, border: `1px solid ${MD_COLORS.cardBorder}`,
                      background: "transparent", color: MD_COLORS.dim, cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                    }}>📋 Copy</button>
                </div>
              )}
            </div>

            {/* Gemini AI Summary */}
            <div style={{
              background: MD_COLORS.card, borderRadius: 14, padding: 24, marginTop: 16,
              border: `1px solid ${MD_COLORS.cardBorder}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>✨</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Gemini AI Summary</h3>
                <span style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 4,
                  background: "#4285f422", color: "#4285f4", fontWeight: 600,
                }}>Powered by Google Gemini</span>
              </div>

              {!geminiKey ? (
                <div style={{
                  textAlign: "center", padding: 24, color: MD_COLORS.dim,
                  background: MD_COLORS.surface, borderRadius: 10,
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔑</div>
                  <div style={{ fontSize: 13, marginBottom: 12 }}>
                    Enter your Gemini API Key to enable AI summaries.
                  </div>
                  <div style={{ fontSize: 12, marginBottom: 12 }}>
                    Get a free key at{" "}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
                      style={{ color: "#4285f4", textDecoration: "underline" }}>
                      aistudio.google.com/apikey
                    </a>
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      id="gemini-key-input"
                      type="password"
                      placeholder="Paste your Gemini API key here…"
                      style={{
                        padding: "8px 12px", borderRadius: 8, border: `1px solid ${MD_COLORS.cardBorder}`,
                        background: MD_COLORS.card, color: MD_COLORS.white, fontSize: 13,
                        fontFamily: "inherit", width: 280, outline: "none",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) { setGeminiApiKey(val); setGeminiKey(val); }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById("gemini-key-input") as HTMLInputElement | null;
                        const val = input?.value.trim();
                        if (val) { setGeminiApiKey(val); setGeminiKey(val); }
                      }}
                      style={{
                        padding: "8px 16px", borderRadius: 8, border: "none",
                        background: "#4285f4", color: "#fff", cursor: "pointer",
                        fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                      }}>Save Key</button>
                  </div>
                </div>
              ) : events.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: MD_COLORS.dim }}>
                  Start the simulation first, then generate an AI-powered summary!
                </div>
              ) : aiSummary ? (
                <>
                  <pre style={{
                    whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "'Segoe UI', sans-serif",
                    fontSize: 13, lineHeight: 1.8, color: MD_COLORS.white, margin: 0,
                    background: MD_COLORS.surface, borderRadius: 10, padding: 20,
                  }}>
                    {aiSummary}
                  </pre>
                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => { navigator.clipboard?.writeText(aiSummary); }}
                      style={{
                        padding: "8px 16px", borderRadius: 8, border: `1px solid ${MD_COLORS.cardBorder}`,
                        background: "transparent", color: MD_COLORS.dim, cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                      }}>📋 Copy</button>
                    <button onClick={requestGeminiSummary} disabled={aiLoading}
                      style={{
                        padding: "8px 16px", borderRadius: 8, border: `1px solid ${MD_COLORS.cardBorder}`,
                        background: "transparent", color: MD_COLORS.dim, cursor: aiLoading ? "wait" : "pointer", fontSize: 12, fontFamily: "inherit",
                      }}>🔄 Regenerate</button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: 20 }}>
                  {aiError && (
                    <div style={{
                      background: "#ef444422", border: "1px solid #ef444444", borderRadius: 8,
                      padding: 12, marginBottom: 16, color: "#ef4444", fontSize: 12, textAlign: "left",
                    }}>
                      ⚠️ {aiError}
                    </div>
                  )}
                  <button onClick={requestGeminiSummary} disabled={aiLoading}
                    style={{
                      padding: "12px 28px", borderRadius: 10, border: "none", fontWeight: 700,
                      background: aiLoading ? MD_COLORS.dim : "linear-gradient(135deg, #4285f4, #34a853)",
                      color: "#ffffff", cursor: aiLoading ? "wait" : "pointer",
                      fontSize: 14, fontFamily: "inherit", transition: "all .2s",
                      opacity: aiLoading ? 0.7 : 1,
                    }}>
                    {aiLoading ? (
                      <span>{aiProgress || "⏳ Generating with Gemini..."}</span>
                    ) : (
                      <span>✨ Generate AI Summary with Gemini</span>
                    )}
                  </button>
                  <div style={{ fontSize: 11, color: MD_COLORS.dim, marginTop: 8 }}>
                    Free • Powered by Google Gemini 2.0 Flash
                  </div>
                </div>
              )}
            </div>

            {/* Shareable card */}
            {events.length > 0 && (
              <div style={{
                marginTop: 16, background: `linear-gradient(135deg, ${MD_COLORS.scoreBg}, ${MD_COLORS.card})`,
                borderRadius: 14, padding: 24, border: `1px solid ${MD_COLORS.cardBorder}`, textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: MD_COLORS.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  📱 Shareable Match Card
                </div>
                <div style={{
                  background: MD_COLORS.bg, borderRadius: 12, padding: "20px 24px", display: "inline-block",
                  border: `1px solid ${MD_COLORS.cardBorder}`, minWidth: 280,
                }}>
                  <div style={{ fontSize: 11, color: MD_COLORS.primary, fontWeight: 700, marginBottom: 8 }}>FIFA WORLD CUP 2022 — FINAL</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 28 }}>{HOME_TEAM.flag}</div>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{HOME_TEAM.shortName}</div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>
                      {homeScore} - {awayScore}
                    </div>
                    <div>
                      <div style={{ fontSize: 28 }}>{AWAY_TEAM.flag}</div>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{AWAY_TEAM.shortName}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: MD_COLORS.dim, marginTop: 8 }}>
                    xG: {interpStats.xG[0].toFixed(2)} - {interpStats.xG[1].toFixed(2)} | Poss: {interpStats.possession[0]}% - {interpStats.possession[1]}%
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Personalization footer */}
      <div style={{
        padding: "8px 16px", borderTop: `1px solid ${MD_COLORS.cardBorder}`,
        background: "rgba(0,0,0,.3)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: MD_COLORS.dim,
      }}>
        <span>
          {favoriteTeam ? `Following: ${favoriteTeam === "home" ? HOME_TEAM.name : AWAY_TEAM.name} ⭐` : "Tap a team to follow"}
        </span>
        <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <input type="checkbox" checked={alertsEnabled} onChange={e => setAlertsEnabled(e.target.checked)}
            style={{ accentColor: MD_COLORS.primary }} />
          Highlight alerts
        </label>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component — Quiz
// ═══════════════════════════════════════════════════════════════════════════════

const QuizView = () => {
  const [phase, setPhase]             = useState<GamePhase>("menu");
  const [mode, setMode]               = useState<GameMode>("solo");
  const [selectedCats, setSelectedCats] = useState<Set<Category>>(new Set(["players", "history", "venues", "statistics"]));
  const [questions, setQuestions]      = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [players, setPlayers]         = useState<Player[]>([makePlayer("Player 1")]);
  const [currentPlayerIdx, setCurPlayer] = useState(0);
  const [timer, setTimer]             = useState(TIMER_SECONDS);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [eliminated, setEliminated]   = useState<Set<number>>(new Set());
  const [doubleActive, setDoubleActive] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(loadLeaderboard);
  const [globalCorr, setGlobalCorr]   = useState<GlobalCorrectness>(loadGlobalCorrectness);
  const [nameInput, setNameInput]     = useState("");
  const [nameSaved, setNameSaved]     = useState(false);
  const [duelNames, setDuelNames]     = useState<[string, string]>(["Player 1", "Player 2"]);
  const [shuffledOptions, setShuffledOptions] = useState<{options: string[]; correctIdx: number}>({ options: [], correctIdx: 0 });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);
  const timerValueRef = useRef(TIMER_SECONDS);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLive = mode === "live-host";
  const currentQuestion = questions[currentIdx] ?? null;
  const currentPlayer = players[currentPlayerIdx];

  // ── Timer logic ────────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const handleTimeUpRef = useRef<() => void>(() => { /* noop */ });

  const startTimer = useCallback(() => {
    stopTimer();
    setTimer(TIMER_SECONDS);
    timerValueRef.current = TIMER_SECONDS;
    timerRef.current = setInterval(() => {
      timerValueRef.current--;
      setTimer(timerValueRef.current);
      if (timerValueRef.current <= 0) {
        stopTimer();
        if (!answeredRef.current) {
          answeredRef.current = true;
          handleTimeUpRef.current();
        }
      }
    }, 1000);
  }, [stopTimer]);

  useEffect(() => () => {
    stopTimer();
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
  }, [stopTimer]);

  // ── Shuffle options for current question ───────────────────────────────────
  useEffect(() => {
    if (!currentQuestion) return;
    const indices = currentQuestion.options.map((_: string, i: number) => i);
    const shuffled = shuffleArray(indices);
    setShuffledOptions({
      options: shuffled.map((i: number) => currentQuestion.options[i]),
      correctIdx: shuffled.indexOf(currentQuestion.correctIndex),
    });
    setEliminated(new Set());
    setDoubleActive(false);
    setSelectedAnswer(null);
    setShowFeedback(false);
    answeredRef.current = false;
  }, [currentIdx, questions]);

  // ── Advance question ───────────────────────────────────────────────────────
  const advanceQuestion = useCallback(() => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      stopTimer();
      setPhase("results");
      return;
    }
    if (mode === "duel") {
      setCurPlayer(prev => (prev + 1) % 2);
    }
    setCurrentIdx(nextIdx);
    setShowFeedback(false);
    setSelectedAnswer(null);
    answeredRef.current = false;
    startTimer();
  }, [currentIdx, questions.length, mode, stopTimer, startTimer]);

  // ── Handle time up ─────────────────────────────────────────────────────────
  const handleTimeUp = useCallback(() => {
    setShowFeedback(true);
    setSelectedAnswer(-1);

    const q = currentQuestion!;
    const updatedCorr = updateCorrectness(q.id, false, globalCorr);
    setGlobalCorr(updatedCorr);
    saveGlobalCorrectness(updatedCorr);

    setPlayers(prev => {
      const next = [...prev];
      const p = { ...next[currentPlayerIdx] };
      p.streak = 0;
      p.wrong++;
      next[currentPlayerIdx] = p;
      return next;
    });

    feedbackTimeoutRef.current = setTimeout(() => advanceQuestion(), 1800);
  }, [currentQuestion, globalCorr, currentPlayerIdx, advanceQuestion]);

  // Keep ref in sync
  useEffect(() => { handleTimeUpRef.current = handleTimeUp; }, [handleTimeUp]);

  // ── Start game ─────────────────────────────────────────────────────────────
  const startGame = useCallback((gameMode: GameMode) => {
    const cats = selectedCats.size > 0 ? selectedCats : new Set(Object.keys(CATEGORY_META) as Category[]);
    const pool = QUESTIONS.filter(q => cats.has(q.category));
    const shuffled = shuffleArray(pool).slice(0, QUESTIONS_PER_ROUND);
    if (shuffled.length === 0) return;

    setMode(gameMode);
    setQuestions(shuffled);
    setCurrentIdx(0);

    if (gameMode === "duel") {
      setPlayers([makePlayer(duelNames[0] || "Player 1"), makePlayer(duelNames[1] || "Player 2")]);
    } else {
      setPlayers([makePlayer("Player 1")]);
    }
    setCurPlayer(0);
    setShowFeedback(false);
    setSelectedAnswer(null);
    setDoubleActive(false);
    setNameSaved(false);
    setNameInput("");
    answeredRef.current = false;
    setPhase("playing");
    setTimeout(() => startTimer(), 150);
  }, [selectedCats, startTimer, duelNames]);

  // ── Handle answer ──────────────────────────────────────────────────────────
  const handleAnswer = useCallback((optionIndex: number) => {
    if (answeredRef.current || showFeedback) return;
    answeredRef.current = true;
    stopTimer();
    setSelectedAnswer(optionIndex);
    setShowFeedback(true);

    const isCorrect = optionIndex === shuffledOptions.correctIdx;
    const q = currentQuestion!;
    const rate = getGlobalRate(q.id, globalCorr);
    const timeLeft = timerValueRef.current;

    setPlayers(prev => {
      const next = [...prev];
      const p = { ...next[currentPlayerIdx] };
      if (isCorrect) {
        p.streak++;
        p.bestStreak = Math.max(p.bestStreak, p.streak);
        p.correct++;
        p.score += calculateScore(q.difficulty, rate, timeLeft, doubleActive, p.streak);
      } else {
        p.streak = 0;
        p.wrong++;
      }
      next[currentPlayerIdx] = p;
      return next;
    });

    const updatedCorr = updateCorrectness(q.id, isCorrect, globalCorr);
    setGlobalCorr(updatedCorr);
    saveGlobalCorrectness(updatedCorr);

    feedbackTimeoutRef.current = setTimeout(() => advanceQuestion(), 1800);
  }, [showFeedback, shuffledOptions, currentQuestion, globalCorr, currentPlayerIdx, doubleActive, stopTimer, advanceQuestion]);

  // ── Power-ups ──────────────────────────────────────────────────────────────
  const usePowerUp = useCallback((type: PowerUpType) => {
    if (showFeedback || answeredRef.current) return;
    const p = players[currentPlayerIdx];
    if (p.powerUps[type] <= 0) return;

    setPlayers(prev => {
      const next = [...prev];
      const pp = { ...next[currentPlayerIdx], powerUps: { ...next[currentPlayerIdx].powerUps } };
      pp.powerUps[type]--;
      next[currentPlayerIdx] = pp;
      return next;
    });

    if (type === "skip") {
      answeredRef.current = true;
      stopTimer();
      setTimeout(() => advanceQuestion(), 300);
    } else if (type === "double") {
      setDoubleActive(true);
    } else if (type === "fifty-fifty") {
      const wrongIndices = shuffledOptions.options
        .map((_: string, i: number) => i)
        .filter((i: number) => i !== shuffledOptions.correctIdx && !eliminated.has(i));
      const toElim = shuffleArray(wrongIndices).slice(0, 2);
      setEliminated(new Set([...eliminated, ...toElim]));
    }
  }, [showFeedback, players, currentPlayerIdx, shuffledOptions, eliminated, stopTimer, advanceQuestion]);

  // ── Save to leaderboard ────────────────────────────────────────────────────
  const saveToLeaderboard = useCallback((pName: string, pScore: number, pCorrect: number, pTotal: number) => {
    const entry: LeaderboardEntry = {
      name: pName, score: pScore, correct: pCorrect, total: pTotal,
      mode, date: new Date().toLocaleDateString(),
    };
    const updated = [...leaderboard, entry].sort((a, b) => b.score - a.score).slice(0, MAX_LEADERBOARD);
    setLeaderboard(updated);
    saveLeaderboard(updated);
    setNameSaved(true);
  }, [leaderboard, mode]);

  // ── Category toggle ────────────────────────────────────────────────────────
  const toggleCategory = useCallback((c: Category) => {
    setSelectedCats(prev => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh", background: `linear-gradient(160deg, ${COLORS.bg} 0%, #0a1f0c 50%, #0d1a1f 100%)`,
    color: COLORS.white, fontFamily: "'Segoe UI','Helvetica Neue',Arial,sans-serif",
    display: "flex", flexDirection: "column", overflow: "auto",
  };

  const cardStyle: React.CSSProperties = {
    background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
    borderRadius: 16, padding: isLive ? 40 : 28, maxWidth: isLive ? 900 : 600,
    width: "100%", margin: "0 auto", animation: "wcq-fadeIn .5s ease-out",
  };

  // ── MENU ───────────────────────────────────────────────────────────────────
  const renderMenu = () => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
      <div style={{ fontSize: isLive ? 72 : 54, marginBottom: 0 }}>🏆</div>
      <h1 style={{
        fontSize: isLive ? 42 : 28, fontWeight: 900, margin: 0, textAlign: "center",
        background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.accent})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>World Cup Quiz Arena</h1>
      <p style={{ color: COLORS.dimWhite, fontSize: isLive ? 18 : 13, margin: "4px 0 20px", textAlign: "center", maxWidth: 400 }}>
        Test your football knowledge! Dynamic scoring, anti-cheat timers, and power-ups await. ⚽
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {([["solo", "⚽ Solo", "Play alone"], ["duel", "⚔️ Duel", "Local 2-player"], ["live-host", "📺 Live Host", "Big screen mode"]] as const).map(([m, label, sub]) => (
          <button key={m} onClick={() => { setMode(m as GameMode); setPhase("category-select"); }}
            style={{
              padding: "18px 28px", borderRadius: 14, border: `2px solid ${COLORS.gold}33`,
              background: COLORS.surface, color: COLORS.white, cursor: "pointer",
              fontSize: isLive ? 20 : 15, fontWeight: 700, fontFamily: "inherit",
              minWidth: 150, transition: "all .2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
            <span>{label}</span>
            <span style={{ fontSize: 11, color: COLORS.dimWhite, fontWeight: 400 }}>{sub}</span>
          </button>
        ))}
      </div>

      <button onClick={() => { setLeaderboard(loadLeaderboard()); setPhase("leaderboard"); }}
        style={{
          marginTop: 18, padding: "10px 24px", borderRadius: 10,
          border: `1px solid ${COLORS.border}`, background: "transparent",
          color: COLORS.dimWhite, cursor: "pointer", fontSize: 13, fontFamily: "inherit",
        }}>
        🏅 Leaderboard
      </button>
    </div>
  );

  // ── CATEGORY SELECT ────────────────────────────────────────────────────────
  const renderCategorySelect = () => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 20 }}>
      <h2 style={{ fontSize: isLive ? 30 : 22, fontWeight: 800, margin: 0 }}>📋 Choose Categories</h2>
      <p style={{ color: COLORS.dimWhite, fontSize: 13, margin: 0 }}>Select one or more (all selected = mixed mode)</p>

      <CategorySelector selected={selectedCats} onToggle={toggleCategory} isLive={isLive} />

      {mode === "duel" && (
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          {[0, 1].map(i => (
            <input key={i} value={duelNames[i]} placeholder={`Player ${i + 1}`}
              onChange={e => {
                const n = [...duelNames] as [string, string];
                n[i] = e.target.value;
                setDuelNames(n);
              }}
              style={{
                padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
                background: COLORS.surface, color: COLORS.white, fontSize: 14, fontFamily: "inherit",
                width: 140, textAlign: "center",
              }}
            />
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button onClick={() => setPhase("menu")} style={{
          padding: "12px 24px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
          background: "transparent", color: COLORS.dimWhite, cursor: "pointer", fontSize: 14, fontFamily: "inherit",
        }}>← Back</button>
        <button onClick={() => startGame(mode)} disabled={selectedCats.size === 0}
          style={{
            padding: "12px 32px", borderRadius: 10, border: "none", fontWeight: 800,
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLt})`,
            color: COLORS.white, cursor: selectedCats.size === 0 ? "not-allowed" : "pointer",
            fontSize: isLive ? 20 : 15, fontFamily: "inherit",
            opacity: selectedCats.size === 0 ? 0.4 : 1, transition: "all .2s",
            animation: selectedCats.size > 0 ? "wcq-glow 2s infinite" : undefined,
          }}>
          Start Game ⚽
        </button>
      </div>
    </div>
  );

  // ── PLAYING ────────────────────────────────────────────────────────────────
  const renderPlaying = () => {
    if (!currentQuestion) return null;
    const q = currentQuestion;
    const diffMeta = DIFFICULTY_LABELS[q.difficulty];
    const catMeta = CATEGORY_META[q.category];
    const rate = getGlobalRate(q.id, globalCorr);

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: isLive ? 32 : 16, gap: 16 }}>
        {/* HUD */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
          padding: "10px 16px", background: "rgba(0,0,0,.3)", borderRadius: 12,
        }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {players.map((p, i) => (
              <div key={i} style={{
                padding: "4px 14px", borderRadius: 8,
                background: i === currentPlayerIdx ? "rgba(255,215,0,.12)" : "transparent",
                border: i === currentPlayerIdx ? `1px solid ${COLORS.gold}55` : "1px solid transparent",
                transition: "all .3s",
              }}>
                <div style={{ fontSize: isLive ? 14 : 11, color: COLORS.dimWhite }}>{p.name}</div>
                <div style={{ fontSize: isLive ? 24 : 18, fontWeight: 800, color: COLORS.accent }}>{p.score}</div>
                {p.streak > 1 && <div style={{ fontSize: 10, color: COLORS.gold }}>🔥 x{p.streak}</div>}
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: isLive ? 14 : 11, color: COLORS.dimWhite }}>Question</div>
            <div style={{ fontSize: isLive ? 22 : 16, fontWeight: 800 }}>{currentIdx + 1}/{questions.length}</div>
          </div>
          <TimerCircle seconds={timer} maxSeconds={TIMER_SECONDS} isRunning={!showFeedback} onExpire={() => { /* noop */ }} isLive={isLive} />
        </div>

        {mode === "duel" && (
          <div style={{
            textAlign: "center", padding: "6px 0", fontSize: isLive ? 18 : 14, fontWeight: 700,
            color: COLORS.gold, animation: "wcq-slideDown .4s ease-out",
          }}>
            🎯 {currentPlayer.name}'s turn
          </div>
        )}

        {/* Question Card */}
        <div style={{ ...cardStyle, animation: "wcq-fadeIn .4s ease-out" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{
              padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: diffMeta.color + "22", color: diffMeta.color, border: `1px solid ${diffMeta.color}44`,
            }}>{diffMeta.label}</span>
            <span style={{
              padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: COLORS.surface, color: COLORS.dimWhite,
            }}>{catMeta.emoji} {catMeta.label}</span>
            {doubleActive && (
              <span style={{
                padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800,
                background: "rgba(255,215,0,.15)", color: COLORS.gold, border: `1px solid ${COLORS.gold}55`,
                animation: "wcq-pulse 1s infinite",
              }}>✖️2 ACTIVE</span>
            )}
            <span style={{ marginLeft: "auto", fontSize: 10, color: COLORS.dimWhite }}>
              Global accuracy: {Math.round(rate * 100)}%
            </span>
          </div>

          <h2 style={{
            fontSize: isLive ? 28 : 20, fontWeight: 700, margin: "0 0 22px", lineHeight: 1.45,
          }}>{q.text}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {shuffledOptions.options.map((opt, i) => {
              const isElim = eliminated.has(i);
              const isCorrectOpt = i === shuffledOptions.correctIdx;
              const isSelected = selectedAnswer === i;
              let bg = COLORS.surface;
              let border = COLORS.border;
              let color = COLORS.white;

              if (showFeedback) {
                if (isCorrectOpt) { bg = COLORS.correct + "25"; border = COLORS.correct; color = COLORS.correct; }
                else if (isSelected && !isCorrectOpt) { bg = COLORS.wrong + "25"; border = COLORS.wrong; color = COLORS.wrong; }
              }

              return (
                <button key={i} disabled={showFeedback || isElim}
                  onClick={() => handleAnswer(i)}
                  style={{
                    padding: isLive ? "18px 16px" : "14px 14px",
                    borderRadius: 10,
                    border: `2px solid ${border}`,
                    background: bg,
                    color: isElim ? "#333" : color,
                    cursor: showFeedback || isElim ? "default" : "pointer",
                    fontSize: isLive ? 19 : 14, fontWeight: 600, fontFamily: "inherit",
                    textAlign: "left", transition: "all .2s",
                    opacity: isElim ? 0.25 : 1,
                    animation: showFeedback && isSelected && !isCorrectOpt ? "wcq-shake .4s ease" : undefined,
                    textDecoration: isElim ? "line-through" : "none",
                  }}>
                  <span style={{ fontWeight: 800, marginRight: 8, color: COLORS.dimWhite, fontSize: 12 }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                  {showFeedback && isCorrectOpt && " ✅"}
                  {showFeedback && isSelected && !isCorrectOpt && " ❌"}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 4 }}>
          <PowerUpBar powerUps={currentPlayer.powerUps} onUse={usePowerUp} disabled={showFeedback} isLive={isLive} />
        </div>
      </div>
    );
  };

  // ── RESULTS ────────────────────────────────────────────────────────────────
  const renderResults = () => {
    const winner = mode === "duel" ? (players[0].score >= players[1].score ? players[0] : players[1]) : players[0];
    const isDuel = mode === "duel";
    const total = questions.length;
    const tied = isDuel && players[0].score === players[1].score;

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 16, position: "relative" }}>
        <Confetti />

        <div style={{ ...cardStyle, textAlign: "center", position: "relative", zIndex: 5 }}>
          <div style={{ fontSize: isLive ? 56 : 42, marginBottom: 6 }}>🏆</div>
          <h2 style={{ fontSize: isLive ? 32 : 24, fontWeight: 900, margin: "0 0 4px" }}>
            {isDuel ? (tied ? "It's a Tie!" : `${winner.name} Wins!`) : "Game Over!"}
          </h2>

          <div style={{ display: "flex", justifyContent: "center", gap: 24, margin: "18px 0", flexWrap: "wrap" }}>
            {players.map((p, i) => (
              <div key={i} style={{
                padding: "16px 24px", borderRadius: 12,
                background: (isDuel && p === winner && !tied) ? "rgba(255,215,0,.1)" : COLORS.surface,
                border: `1px solid ${(isDuel && p === winner && !tied) ? COLORS.gold : COLORS.border}`,
                minWidth: 140,
              }}>
                {isDuel && <div style={{ fontSize: 12, color: COLORS.dimWhite, marginBottom: 4 }}>{p.name}</div>}
                <div style={{ fontSize: isLive ? 44 : 34, fontWeight: 900, color: COLORS.gold }}>{p.score}</div>
                <div style={{ fontSize: 12, color: COLORS.dimWhite, marginTop: 6 }}>
                  ✅ {p.correct} correct &nbsp; ❌ {p.wrong} wrong
                </div>
                <div style={{ fontSize: 12, color: COLORS.dimWhite }}>
                  🎯 {total > 0 ? Math.round(p.correct / (isDuel ? Math.ceil(total / 2) : total) * 100) : 0}% accuracy
                </div>
                <div style={{ fontSize: 12, color: COLORS.gold }}>
                  🔥 Best streak: {p.bestStreak}
                </div>
              </div>
            ))}
          </div>

          {!nameSaved ? (
            <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
              {!isDuel && (
                <input value={nameInput} placeholder="Your name"
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && nameInput.trim()) {
                      saveToLeaderboard(nameInput.trim(), players[0].score, players[0].correct, total);
                    }
                  }}
                  style={{
                    padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
                    background: COLORS.surface, color: COLORS.white, fontSize: 14, fontFamily: "inherit", width: 180,
                  }}
                />
              )}
              <button disabled={!isDuel && !nameInput.trim()}
                onClick={() => {
                  if (isDuel) {
                    saveToLeaderboard(players[0].name, players[0].score, players[0].correct, Math.ceil(total / 2));
                    setTimeout(() => {
                      const lb = loadLeaderboard();
                      const entry2: LeaderboardEntry = {
                        name: players[1].name, score: players[1].score, correct: players[1].correct, total: Math.ceil(total / 2),
                        mode, date: new Date().toLocaleDateString(),
                      };
                      const upd = [...lb, entry2].sort((a, b) => b.score - a.score).slice(0, MAX_LEADERBOARD);
                      setLeaderboard(upd);
                      saveLeaderboard(upd);
                    }, 50);
                    setNameSaved(true);
                  } else if (nameInput.trim()) {
                    saveToLeaderboard(nameInput.trim(), players[0].score, players[0].correct, total);
                  }
                }}
                style={{
                  padding: "10px 20px", borderRadius: 8, border: "none", fontWeight: 700,
                  background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
                  color: "#000", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                  opacity: (!isDuel && !nameInput.trim()) ? 0.4 : 1,
                }}>
                {isDuel ? "Save Both Scores" : "Save Score"} 🏅
              </button>
            </div>
          ) : (
            <div style={{ color: COLORS.accent, fontSize: 14, marginTop: 8 }}>✅ Saved to leaderboard!</div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
            <button onClick={() => { setLeaderboard(loadLeaderboard()); setPhase("leaderboard"); }}
              style={{
                padding: "10px 22px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
                background: "transparent", color: COLORS.dimWhite, cursor: "pointer", fontSize: 13, fontFamily: "inherit",
              }}>🏅 Leaderboard</button>
            <button onClick={() => setPhase("category-select")}
              style={{
                padding: "10px 22px", borderRadius: 10, border: "none", fontWeight: 700,
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLt})`,
                color: COLORS.white, cursor: "pointer", fontSize: 14, fontFamily: "inherit",
              }}>Play Again ⚽</button>
          </div>
        </div>
      </div>
    );
  };

  // ── LEADERBOARD ────────────────────────────────────────────────────────────
  const renderLeaderboard = () => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
      <div style={{ ...cardStyle }}>
        <h2 style={{ fontSize: isLive ? 28 : 22, fontWeight: 800, margin: "0 0 16px", textAlign: "center" }}>
          🏅 Leaderboard
        </h2>
        <LeaderboardTable entries={leaderboard} isLive={isLive} />
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={() => setPhase("menu")}
            style={{
              padding: "10px 24px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
              background: "transparent", color: COLORS.dimWhite, cursor: "pointer", fontSize: 13, fontFamily: "inherit",
            }}>← Back to Menu</button>
        </div>
      </div>
    </div>
  );

  // ── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <div style={containerStyle}>
      <style>{CSS_KEYFRAMES}</style>

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 18px", borderBottom: `1px solid ${COLORS.border}`,
        background: "rgba(0,0,0,.35)", flexShrink: 0,
      }}>
        <div style={{
          fontSize: isLive ? 18 : 14, fontWeight: 800,
          background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.accent})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          cursor: "pointer",
        }} onClick={() => { stopTimer(); if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current); setPhase("menu"); }}>
          🏆 World Cup Quiz Arena
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: COLORS.dimWhite }}>
          <span>⏱ {TIMER_SECONDS}s per question</span>
          <span>📋 {QUESTIONS_PER_ROUND} questions</span>
          {phase !== "menu" && <span style={{ textTransform: "uppercase", color: COLORS.gold }}>{mode}</span>}
        </div>
      </div>

      {phase === "menu" && renderMenu()}
      {phase === "category-select" && renderCategorySelect()}
      {(phase === "playing" || phase === "feedback") && renderPlaying()}
      {phase === "results" && renderResults()}
      {phase === "leaderboard" && renderLeaderboard()}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FollowGameView — Top-Level Hub (Quiz + Matchday Companion)
// ═══════════════════════════════════════════════════════════════════════════════

export const FollowGameView = () => {
  const [appMode, setAppMode] = useState<AppMode>("matchday");

  if (appMode === "quiz") {
    return (
      <div style={{ position: "relative" }}>
        {/* Floating Matchday button */}
        <div style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 1000,
        }}>
          <button onClick={() => setAppMode("matchday")}
            style={{
              padding: "12px 22px", borderRadius: 14, border: "none", fontWeight: 800,
              background: `linear-gradient(135deg, ${MD_COLORS.primary}, ${MD_COLORS.accent})`,
              color: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "'Segoe UI',sans-serif",
              boxShadow: "0 4px 20px rgba(59,130,246,.4)",
              display: "flex", alignItems: "center", gap: 8, transition: "all .2s",
            }}>
            <span>⚽</span> Matchday Live
          </button>
        </div>
        <FollowGameView />
      </div>
    );
  }

  return <MatchdayCompanion onBack={() => setAppMode("quiz")} />;
};

@Feature({
  id: "follow-game",
  label: "follow-game",
  path: "/follow-game",
  icon: "shell:soccer",
  description: "home",
  tags: [""],
  permissions: [],
  features: [],
  visibility: ["private", "public"]
})
export class FollowGamePage extends React.Component {
  static contextType = EnvironmentContext;
  declare context: Environment;

  render() { //return <div> <CounterView/> <DemoView/></div>
    //return <CounterView/>
    return <FollowGameView/>
    //return  <FeatureRegistryVisualizer features={this.context.get(FeatureRegistry).filter((f) => f.parent == undefined)}></FeatureRegistryVisualizer>
  }
}

