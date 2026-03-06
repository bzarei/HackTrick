import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { EnvironmentContext, Feature } from '@novx/portal';
import { Environment } from '@novx/core';

// ═══════════════════════════════════════════════════════════════════════════════
// Types & Interfaces
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
@keyframes wcq-glow { 0%,100%{box-shadow:0 0 12px rgba(226,0,116,.3)} 50%{box-shadow:0 0 28px rgba(226,0,116,.7)} }
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
          fill="none" stroke="rgba(226,0,116,0.12)" strokeWidth={stroke} />
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
              border: `1px solid ${used ? "rgba(226,0,116,.1)" : COLORS.gold + "55"}`,
              borderRadius: 8, cursor: used || disabled ? "not-allowed" : "pointer",
              background: used ? "rgba(226,0,116,.03)" : "rgba(226,0,116,.08)",
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
              background: active ? "rgba(226,0,116,.12)" : COLORS.surface,
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
              <tr key={i} style={{ background: hl ? "rgba(226,0,116,.08)" : "transparent", borderBottom: `1px solid ${COLORS.surface}` }}>
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
      color: ["#e20074", "#ff3399", "#ff5252", "#ff80ab", "#ff9800", "#e040fb"][i % 6],
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
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

export const QuizView = () => {
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
    minHeight: "100vh", background: `linear-gradient(160deg, #ffffff 0%, #fff0f6 50%, #ffe0ef 100%)`,
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
            color: "#ffffff", cursor: selectedCats.size === 0 ? "not-allowed" : "pointer",
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
          padding: "10px 16px", background: "rgba(226,0,116,.06)", borderRadius: 12,
        }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {players.map((p, i) => (
              <div key={i} style={{
                padding: "4px 14px", borderRadius: 8,
                background: i === currentPlayerIdx ? "rgba(226,0,116,.12)" : "transparent",
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
                background: "rgba(226,0,116,.15)", color: COLORS.gold, border: `1px solid ${COLORS.gold}55`,
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
                background: (isDuel && p === winner && !tied) ? "rgba(226,0,116,.1)" : COLORS.surface,
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
                  color: "#ffffff", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
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
                color: "#ffffff", cursor: "pointer", fontSize: 14, fontFamily: "inherit",
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

@Feature({
  id: "quiz",
  label: "quiz",
  path: "/quiz",
  icon: "shell:quiz",
  description: "home",
  tags: [""],
  permissions: [],
  features: [],
  visibility: ["private", "public"]
})
export class QuizPage extends React.Component {
  static contextType = EnvironmentContext;
  declare context: Environment;

  render() { //return <div> <CounterView/> <DemoView/></div>
    //return <CounterView/>
    return <QuizView/>
    //return  <FeatureRegistryVisualizer features={this.context.get(FeatureRegistry).filter((f) => f.parent == undefined)}></FeatureRegistryVisualizer>
  }
}
