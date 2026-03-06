import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { EnvironmentContext, Feature } from '@novx/portal';
import { Environment } from '@novx/core';

// ═══════════════════════════════════════════════════════════════════════════════
// Types & Interfaces
// ═══════════════════════════════════════════════════════════════════════════════

type Category   = "culture" | "history" | "geography" | "famous-people";
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
const STORAGE_PREFIX      = "indiaquiz_";
const MAX_LEADERBOARD     = 20;

const COLORS = {
  bg:        "#1a0f00",
  bgCard:    "#221508",
  primary:   "#FF9933",
  primaryLt: "#e68a2e",
  gold:      "#FF9933",
  goldDark:  "#cc7a29",
  white:     "#f5f5f5",
  dimWhite:  "#b0b0b0",
  correct:   "#43a047",
  wrong:     "#d32f2f",
  accent:    "#138808",
  danger:    "#ff5252",
  surface:   "rgba(255,255,255,0.06)",
  border:    "rgba(255,255,255,0.1)",
};

const CATEGORY_META: Record<Category, { label: string; emoji: string }> = {
  culture:       { label: "Culture",       emoji: "🎭" },
  history:       { label: "History",       emoji: "📜" },
  geography:     { label: "Geography",     emoji: "🗺️" },
  "famous-people": { label: "Famous People", emoji: "⭐" },
};

const DIFFICULTY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Easy",   color: "#43a047" },
  2: { label: "Medium", color: "#ffa726" },
  3: { label: "Hard",   color: "#ef5350" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Question Pool (75 curated India questions)
// ═══════════════════════════════════════════════════════════════════════════════

const QUESTIONS: Question[] = [
  // ── Culture ────────────────────────────────────────────────────────────────
  { id:1,  category:"culture", difficulty:1, text:"What is Diwali?", options:["The Hindu festival of lights","A harvest festival","A new year celebration","A spring festival"], correctIndex:0 },
  { id:2,  category:"culture", difficulty:1, text:"Which language is the most widely spoken in India?", options:["Hindi","Bengali","Tamil","Telugu"], correctIndex:0 },
  { id:3,  category:"culture", difficulty:2, text:"What is the traditional Indian greeting gesture called?", options:["Namaste","Salaam","Pranam","Vanakkam"], correctIndex:0 },
  { id:4,  category:"culture", difficulty:1, text:"Which sport is the most popular in India?", options:["Cricket","Football","Hockey","Kabaddi"], correctIndex:0 },
  { id:5,  category:"culture", difficulty:2, text:"What is 'Rangoli'?", options:["Decorative floor art made with colored powders","A type of dance","A musical instrument","A wedding ritual"], correctIndex:0 },
  { id:6,  category:"culture", difficulty:3, text:"What is the Mahabharata?", options:["One of the two major Sanskrit epics of ancient India","A holy book of Sikhism","A Buddhist scripture","A Mughal historical text"], correctIndex:0 },
  { id:7,  category:"culture", difficulty:1, text:"What is the most popular drink in India?", options:["Chai (Tea)","Coffee","Lassi","Coconut water"], correctIndex:0 },
  { id:8,  category:"culture", difficulty:2, text:"Which Indian dish is a spiced rice dish often made with meat or vegetables?", options:["Biryani","Dal Makhani","Paneer Tikka","Chole Bhature"], correctIndex:0 },
  { id:9,  category:"culture", difficulty:3, text:"What is 'Holi'?", options:["The festival of colors celebrating spring","A harvest festival","A winter solstice celebration","A religious fasting day"], correctIndex:0 },
  { id:10, category:"culture", difficulty:2, text:"Which classical Indian dance form originates from Tamil Nadu?", options:["Bharatanatyam","Kathak","Odissi","Kuchipudi"], correctIndex:0 },
  { id:11, category:"culture", difficulty:1, text:"How many official languages does India recognize in its constitution?", options:["22","18","14","26"], correctIndex:0 },
  { id:12, category:"culture", difficulty:3, text:"What is 'Kathakali'?", options:["A classical dance-drama from Kerala","A type of Indian cuisine","A meditation technique","A martial art"], correctIndex:0 },
  { id:13, category:"culture", difficulty:2, text:"Which city is famous for its silk sarees called 'Banarasi'?", options:["Varanasi","Jaipur","Mysore","Kanchipuram"], correctIndex:0 },
  { id:14, category:"culture", difficulty:1, text:"What is the Indian flatbread cooked in a tandoor called?", options:["Naan","Roti","Paratha","Puri"], correctIndex:0 },
  { id:15, category:"culture", difficulty:3, text:"What is 'Pongal'?", options:["A Tamil harvest festival","A Hindu wedding ceremony","A Buddhist prayer ritual","A type of Indian sweet"], correctIndex:0 },

  // ── History ────────────────────────────────────────────────────────────────
  { id:16, category:"history", difficulty:1, text:"Who is known as the 'Father of the Nation' in India?", options:["Mahatma Gandhi","Jawaharlal Nehru","Subhas Chandra Bose","Bhagat Singh"], correctIndex:0 },
  { id:17, category:"history", difficulty:1, text:"In which year did India gain independence from British rule?", options:["1947","1950","1942","1937"], correctIndex:0 },
  { id:18, category:"history", difficulty:2, text:"Who was the first Prime Minister of India?", options:["Jawaharlal Nehru","Sardar Patel","Rajendra Prasad","B.R. Ambedkar"], correctIndex:0 },
  { id:19, category:"history", difficulty:1, text:"Which ancient civilization flourished in the Indus Valley?", options:["Harappan civilization","Mesopotamian civilization","Egyptian civilization","Chinese civilization"], correctIndex:0 },
  { id:20, category:"history", difficulty:2, text:"Who built the Taj Mahal?", options:["Shah Jahan","Akbar","Aurangzeb","Babur"], correctIndex:0 },
  { id:21, category:"history", difficulty:3, text:"Which Mughal emperor introduced the policy of 'Sulh-i-Kul' (universal peace)?", options:["Akbar","Shah Jahan","Jahangir","Humayun"], correctIndex:0 },
  { id:22, category:"history", difficulty:2, text:"What was the Salt March (Dandi March) in 1930?", options:["A nonviolent protest led by Gandhi against the British salt tax","A military campaign","A religious pilgrimage","A trade route expedition"], correctIndex:0 },
  { id:23, category:"history", difficulty:1, text:"Who was Ashoka the Great?", options:["A Mauryan emperor who spread Buddhism","A Mughal ruler","A British governor","A Chola king"], correctIndex:0 },
  { id:24, category:"history", difficulty:3, text:"Which empire was founded by Chandragupta Maurya?", options:["Maurya Empire","Gupta Empire","Chola Empire","Vijayanagara Empire"], correctIndex:0 },
  { id:25, category:"history", difficulty:2, text:"What was the Jallianwala Bagh massacre?", options:["A 1919 British shooting of unarmed Indians in Amritsar","A battle in 1857","A Mughal siege","A famine event"], correctIndex:0 },
  { id:26, category:"history", difficulty:1, text:"Which movement did Gandhi lead with the principle of non-violence?", options:["Indian Independence Movement","French Revolution","Russian Revolution","American Revolution"], correctIndex:0 },
  { id:27, category:"history", difficulty:3, text:"Who was the last Mughal emperor?", options:["Bahadur Shah Zafar","Aurangzeb","Akbar II","Shah Alam II"], correctIndex:0 },
  { id:28, category:"history", difficulty:2, text:"The Battle of Plassey in 1757 established which power in India?", options:["British East India Company","French East India Company","Dutch East India Company","Portuguese Empire"], correctIndex:0 },
  { id:29, category:"history", difficulty:1, text:"When did India become a republic?", options:["January 26, 1950","August 15, 1947","November 26, 1949","March 12, 1930"], correctIndex:0 },
  { id:30, category:"history", difficulty:3, text:"What was the Quit India Movement of 1942?", options:["A mass protest demanding end of British rule","A trade boycott","A military mutiny","A constitutional amendment campaign"], correctIndex:0 },

  // ── Geography ─────────────────────────────────────────────────────────────
  { id:31, category:"geography", difficulty:1, text:"What is the capital city of India?", options:["New Delhi","Mumbai","Kolkata","Chennai"], correctIndex:0 },
  { id:32, category:"geography", difficulty:2, text:"Which mountain range lies along India's northern border?", options:["Himalayas","Western Ghats","Eastern Ghats","Aravalli Range"], correctIndex:0 },
  { id:33, category:"geography", difficulty:1, text:"Which river is considered the holiest in India?", options:["Ganges (Ganga)","Yamuna","Brahmaputra","Godavari"], correctIndex:0 },
  { id:34, category:"geography", difficulty:2, text:"What is India's highest peak?", options:["Kangchenjunga","Nanda Devi","K2","Mount Everest"], correctIndex:0 },
  { id:35, category:"geography", difficulty:3, text:"The Thar Desert is located in which Indian state?", options:["Rajasthan","Gujarat","Maharashtra","Madhya Pradesh"], correctIndex:0 },
  { id:36, category:"geography", difficulty:1, text:"Which ocean borders India to the south?", options:["Indian Ocean","Pacific Ocean","Atlantic Ocean","Arctic Ocean"], correctIndex:0 },
  { id:37, category:"geography", difficulty:2, text:"Which city is known as the 'Pink City'?", options:["Jaipur","Udaipur","Jodhpur","Agra"], correctIndex:0 },
  { id:38, category:"geography", difficulty:3, text:"What is the approximate area of India?", options:["3.28 million km²","1.5 million km²","5 million km²","2 million km²"], correctIndex:0 },
  { id:39, category:"geography", difficulty:2, text:"Which Indian state is known as 'God's Own Country'?", options:["Kerala","Goa","Karnataka","Tamil Nadu"], correctIndex:0 },
  { id:40, category:"geography", difficulty:1, text:"How many states does India have?", options:["28","29","30","25"], correctIndex:0 },
  { id:41, category:"geography", difficulty:3, text:"Which is the largest state in India by area?", options:["Rajasthan","Madhya Pradesh","Maharashtra","Uttar Pradesh"], correctIndex:0 },
  { id:42, category:"geography", difficulty:2, text:"Which city is known as the 'City of Lakes'?", options:["Udaipur","Bhopal","Nainital","Srinagar"], correctIndex:0 },
  { id:43, category:"geography", difficulty:2, text:"The Sundarbans mangrove forest is located in which state?", options:["West Bengal","Odisha","Kerala","Gujarat"], correctIndex:0 },
  { id:44, category:"geography", difficulty:3, text:"Which Indian river is the longest?", options:["Ganges","Godavari","Brahmaputra","Narmada"], correctIndex:0 },
  { id:45, category:"geography", difficulty:1, text:"What is the approximate population of India?", options:["~1.4 billion","~800 million","~2 billion","~500 million"], correctIndex:0 },

  // ── Famous People ──────────────────────────────────────────────────────────
  { id:46, category:"famous-people", difficulty:1, text:"Who wrote the Indian national anthem 'Jana Gana Mana'?", options:["Rabindranath Tagore","Bankim Chandra Chattopadhyay","Mahatma Gandhi","Sarojini Naidu"], correctIndex:0 },
  { id:47, category:"famous-people", difficulty:1, text:"Who was the first President of India?", options:["Dr. Rajendra Prasad","Dr. S. Radhakrishnan","Jawaharlal Nehru","Sardar Patel"], correctIndex:0 },
  { id:48, category:"famous-people", difficulty:2, text:"Who is known as the 'Missile Man of India'?", options:["A.P.J. Abdul Kalam","Vikram Sarabhai","Homi Bhabha","C.V. Raman"], correctIndex:0 },
  { id:49, category:"famous-people", difficulty:2, text:"Which Indian mathematician is known for his contributions to number theory and infinite series?", options:["Srinivasa Ramanujan","Aryabhata","Brahmagupta","C.R. Rao"], correctIndex:0 },
  { id:50, category:"famous-people", difficulty:3, text:"Who was Aryabhata?", options:["An ancient Indian mathematician and astronomer","A Mughal emperor","A freedom fighter","A classical musician"], correctIndex:0 },
  { id:51, category:"famous-people", difficulty:1, text:"Sachin Tendulkar is famous for being a what?", options:["Cricket legend","Football player","Chess grandmaster","Boxer"], correctIndex:0 },
  { id:52, category:"famous-people", difficulty:2, text:"Which Indian filmmaker is known for the 'Apu Trilogy'?", options:["Satyajit Ray","Raj Kapoor","Guru Dutt","Bimal Roy"], correctIndex:0 },
  { id:53, category:"famous-people", difficulty:3, text:"Who was the first Indian woman in space?", options:["Kalpana Chawla","Sunita Williams","Rakesh Sharma","Valentina Tereshkova"], correctIndex:0 },
  { id:54, category:"famous-people", difficulty:2, text:"Which Indian chess player became the world champion in 2000?", options:["Viswanathan Anand","Rameshbabu Praggnanandhaa","Koneru Humpy","Pentala Harikrishna"], correctIndex:0 },
  { id:55, category:"famous-people", difficulty:1, text:"Mother Teresa is best known for her work in which Indian city?", options:["Kolkata","Mumbai","Delhi","Chennai"], correctIndex:0 },
  { id:56, category:"famous-people", difficulty:3, text:"Who was C.V. Raman?", options:["An Indian physicist who won the Nobel Prize for the Raman Effect","A freedom fighter","A classical singer","A poet"], correctIndex:0 },
  { id:57, category:"famous-people", difficulty:2, text:"Who is known as the 'Iron Man of India'?", options:["Sardar Vallabhbhai Patel","Bhagat Singh","Subhas Chandra Bose","Lal Bahadur Shastri"], correctIndex:0 },
  { id:58, category:"famous-people", difficulty:1, text:"Who founded the religion of Sikhism?", options:["Guru Nanak","Guru Gobind Singh","Guru Arjan","Guru Tegh Bahadur"], correctIndex:0 },
  { id:59, category:"famous-people", difficulty:3, text:"Who was Swami Vivekananda?", options:["A Hindu monk who represented India at the 1893 Parliament of Religions in Chicago","A Mughal ruler","A British governor","A Bollywood actor"], correctIndex:0 },
  { id:60, category:"famous-people", difficulty:2, text:"Which Indian author won the Booker Prize for 'The God of Small Things'?", options:["Arundhati Roy","Salman Rushdie","Jhumpa Lahiri","R.K. Narayan"], correctIndex:0 },

  // ── Extra mixed ─────────────────────────────────────────────────────────────
  { id:61, category:"culture", difficulty:2, text:"What instrument is the 'sitar' in Indian classical music?", options:["A plucked string instrument","A drum","A flute","A wind instrument"], correctIndex:0 },
  { id:62, category:"history", difficulty:2, text:"The Indian Rebellion of 1857 is also known as what?", options:["The Sepoy Mutiny / First War of Independence","The Salt March","The Quit India Movement","The Partition"], correctIndex:0 },
  { id:63, category:"geography", difficulty:2, text:"Which UNESCO World Heritage Site is a white marble mausoleum in Agra?", options:["Taj Mahal","Qutub Minar","Red Fort","Hampi"], correctIndex:0 },
  { id:64, category:"famous-people", difficulty:1, text:"Who is Virat Kohli?", options:["A legendary Indian cricket captain","A Bollywood actor","A political leader","A scientist"], correctIndex:0 },
  { id:65, category:"history", difficulty:3, text:"What was the 'Green Revolution' in India?", options:["Agricultural modernization program in the 1960s-70s","A military coup","An environmental protest","A constitutional reform"], correctIndex:0 },
  { id:66, category:"geography", difficulty:2, text:"What is the Indian name for the Bay of Bengal?", options:["Bay of Bengal (Banga Upasagar)","Arabian Sea","Lakshadweep Sea","Andaman Sea"], correctIndex:0 },
  { id:67, category:"culture", difficulty:3, text:"What is a 'stepwell' (Baoli)?", options:["An ancient water storage and access structure","A type of temple","A musical instrument","A cooking method"], correctIndex:0 },
  { id:68, category:"famous-people", difficulty:1, text:"Whose memorial is the Raj Ghat in Delhi?", options:["Mahatma Gandhi","Jawaharlal Nehru","Indira Gandhi","Rajiv Gandhi"], correctIndex:0 },
  { id:69, category:"history", difficulty:2, text:"The Chola dynasty was known for its naval power. Where was it based?", options:["Tamil Nadu (South India)","Bengal","Punjab","Rajasthan"], correctIndex:0 },
  { id:70, category:"geography", difficulty:3, text:"Dal Lake is a famous tourist attraction in which region?", options:["Kashmir","Ladakh","Himachal Pradesh","Uttarakhand"], correctIndex:0 },
  { id:71, category:"culture", difficulty:3, text:"What is 'Onam'?", options:["A harvest festival celebrated in Kerala","A North Indian wedding ceremony","A Buddhist prayer festival","A Bollywood award show"], correctIndex:0 },
  { id:72, category:"history", difficulty:1, text:"The Gupta Empire is often called what?", options:["The Golden Age of India","The Iron Age of India","The Silver Age of India","The Bronze Age of India"], correctIndex:0 },
  { id:73, category:"geography", difficulty:1, text:"Which is the most populous city in India?", options:["Mumbai","Delhi","Kolkata","Bangalore"], correctIndex:0 },
  { id:74, category:"famous-people", difficulty:2, text:"Who is A.R. Rahman?", options:["An Oscar-winning Indian music composer","A cricket player","A politician","A novelist"], correctIndex:0 },
  { id:75, category:"culture", difficulty:1, text:"What is 'Yoga'?", options:["An ancient Indian practice of physical, mental, and spiritual discipline","A type of Indian cuisine","A classical dance form","A martial art"], correctIndex:0 },
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
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

export const IndiaQuizView = () => {
  const [phase, setPhase]             = useState<GamePhase>("menu");
  const [mode, setMode]               = useState<GameMode>("solo");
  const [selectedCats, setSelectedCats] = useState<Set<Category>>(new Set(["culture", "history", "geography", "famous-people"]));
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
      <div style={{ fontSize: isLive ? 72 : 54, marginBottom: 0 }}>🇮🇳</div>
      <h1 style={{
        fontSize: isLive ? 42 : 28, fontWeight: 900, margin: 0, textAlign: "center",
        background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.accent})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>India Quiz Arena</h1>
      <p style={{ color: COLORS.dimWhite, fontSize: isLive ? 18 : 13, margin: "4px 0 20px", textAlign: "center", maxWidth: 400 }}>
        Test your knowledge about India! History, culture, geography, and famous Indians. 🇮🇳
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {([["solo", "🇮🇳 Solo", "Play alone"], ["duel", "⚔️ Duel", "Local 2-player"], ["live-host", "📺 Live Host", "Big screen mode"]] as const).map(([m, label, sub]) => (
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
          Start Game 🇮🇳
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
              }}>Play Again 🇮🇳</button>
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
          🇮🇳 India Quiz Arena
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
  id: "india-quiz",
  label: "india-quiz",
  path: "/india-quiz",
  icon: "shell:quiz",
  description: "home",
  tags: [""],
  permissions: [],
  features: [],
  visibility: ["private", "public"]
})
export class IndianQuizPage extends React.Component {
  static contextType = EnvironmentContext;
  declare context: Environment;

  render() {
    return <IndiaQuizView/>
  }
}