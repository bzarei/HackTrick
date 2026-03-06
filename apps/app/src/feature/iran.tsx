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
const STORAGE_PREFIX      = "iranquiz_";
const MAX_LEADERBOARD     = 20;

const COLORS = {
  bg:        "#0d1b0e",
  bgCard:    "#132215",
  primary:   "#239f40",
  primaryLt: "#2e7d32",
  gold:      "#da0000",
  goldDark:  "#a00000",
  white:     "#f5f5f5",
  dimWhite:  "#b0b0b0",
  correct:   "#43a047",
  wrong:     "#d32f2f",
  accent:    "#00e676",
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
// Question Pool (75 curated Iran questions)
// ═══════════════════════════════════════════════════════════════════════════════

const QUESTIONS: Question[] = [
  // ── Culture ────────────────────────────────────────────────────────────────
  { id:1,  category:"culture", difficulty:1, text:"What is Nowruz?", options:["Iranian/Persian New Year","A religious holiday","A harvest festival","A winter solstice celebration"], correctIndex:0 },
  { id:2,  category:"culture", difficulty:1, text:"Which language is predominantly spoken in Iran?", options:["Persian (Farsi)","Arabic","Turkish","Kurdish"], correctIndex:0 },
  { id:3,  category:"culture", difficulty:2, text:"What is the traditional Iranian New Year table called?", options:["Haft-sin","Sofreh Aghd","Haft-mewa","Sofreh Nowruz"], correctIndex:0 },
  { id:4,  category:"culture", difficulty:1, text:"Which sport is considered the national sport of Iran?", options:["Varzesh-e Bastani (Zurkhaneh)","Football","Wrestling","Polo"], correctIndex:0 },
  { id:5,  category:"culture", difficulty:2, text:"What is 'Taarof' in Iranian culture?", options:["A form of polite social etiquette","A traditional dance","A type of tea ceremony","A wedding ritual"], correctIndex:0 },
  { id:6,  category:"culture", difficulty:3, text:"What is the Shahnameh?", options:["The Persian 'Book of Kings' epic poem","A holy book","A legal codex","A cookbook of Persian recipes"], correctIndex:0 },
  { id:7,  category:"culture", difficulty:1, text:"What is the most popular drink in Iran?", options:["Tea (Chai)","Coffee","Doogh","Pomegranate juice"], correctIndex:0 },
  { id:8,  category:"culture", difficulty:2, text:"Which Iranian dish consists of rice with a crispy bottom crust?", options:["Tahdig","Ghormeh Sabzi","Zereshk Polo","Fesenjan"], correctIndex:0 },
  { id:9,  category:"culture", difficulty:3, text:"What is 'Chaharshanbe Suri'?", options:["Fire-jumping festival before Nowruz","A mourning ceremony","A spring planting festival","A children's holiday"], correctIndex:0 },
  { id:10, category:"culture", difficulty:2, text:"Which stew made with pomegranate and walnut is a signature Persian dish?", options:["Fesenjan","Ghormeh Sabzi","Abgoosht","Ash Reshteh"], correctIndex:0 },
  { id:11, category:"culture", difficulty:1, text:"What is the Persian writing script based on?", options:["Arabic script (modified)","Latin script","Cyrillic script","Cuneiform"], correctIndex:0 },
  { id:12, category:"culture", difficulty:3, text:"What is a 'Zurkhaneh'?", options:["A traditional Iranian gymnasium","A mosque","A bazaar","A palace"], correctIndex:0 },
  { id:13, category:"culture", difficulty:2, text:"Which is a famous traditional Persian carpet-weaving region?", options:["Isfahan","Dubai","Ankara","Kabul"], correctIndex:0 },
  { id:14, category:"culture", difficulty:1, text:"What do the 7 items on the Haft-sin table all start with?", options:["The letter 'S' (sin)","The letter 'A'","The letter 'N'","The letter 'H'"], correctIndex:0 },
  { id:15, category:"culture", difficulty:3, text:"What is 'Sizdah Bedar'?", options:["The 13th day of Nowruz, spent outdoors in nature","A religious fasting day","A harvest celebration","A new moon ritual"], correctIndex:0 },

  // ── History ────────────────────────────────────────────────────────────────
  { id:16, category:"history", difficulty:1, text:"Who founded the Achaemenid Empire?", options:["Cyrus the Great","Darius I","Xerxes I","Cambyses II"], correctIndex:0 },
  { id:17, category:"history", difficulty:1, text:"What was the ancient name of Iran?", options:["Persia","Mesopotamia","Parthia","Media"], correctIndex:0 },
  { id:18, category:"history", difficulty:2, text:"In which year did Iran officially change its name from Persia to Iran?", options:["1935","1925","1941","1953"], correctIndex:0 },
  { id:19, category:"history", difficulty:1, text:"Which ancient empire built Persepolis?", options:["Achaemenid Empire","Sassanid Empire","Safavid Empire","Parthian Empire"], correctIndex:0 },
  { id:20, category:"history", difficulty:2, text:"What is the Cyrus Cylinder often called?", options:["The first declaration of human rights","The first constitution","The first peace treaty","The first alphabet"], correctIndex:0 },
  { id:21, category:"history", difficulty:3, text:"Which dynasty made Shia Islam the official religion of Iran?", options:["Safavid dynasty","Qajar dynasty","Afsharid dynasty","Zand dynasty"], correctIndex:0 },
  { id:22, category:"history", difficulty:2, text:"In which year was the Iranian Revolution?", options:["1979","1969","1989","1953"], correctIndex:0 },
  { id:23, category:"history", difficulty:1, text:"Who was Darius the Great?", options:["An Achaemenid king who expanded the Persian Empire","A poet","A religious leader","A military general of Alexander"], correctIndex:0 },
  { id:24, category:"history", difficulty:3, text:"What was the Sassanid Empire's main religion?", options:["Zoroastrianism","Islam","Christianity","Manichaeism"], correctIndex:0 },
  { id:25, category:"history", difficulty:2, text:"Which battle in 331 BC led to the fall of the Achaemenid Empire?", options:["Battle of Gaugamela","Battle of Thermopylae","Battle of Marathon","Battle of Salamis"], correctIndex:0 },
  { id:26, category:"history", difficulty:1, text:"Which ancient religion originated in Iran?", options:["Zoroastrianism","Buddhism","Hinduism","Taoism"], correctIndex:0 },
  { id:27, category:"history", difficulty:3, text:"Who was the last Shah of Iran?", options:["Mohammad Reza Pahlavi","Reza Shah Pahlavi","Naser al-Din Shah","Ahmad Shah Qajar"], correctIndex:0 },
  { id:28, category:"history", difficulty:2, text:"The Royal Road was built by which Persian king to connect the empire?", options:["Darius I","Cyrus the Great","Xerxes I","Artaxerxes I"], correctIndex:0 },
  { id:29, category:"history", difficulty:1, text:"Which Greek historian is a primary source about ancient Persia?", options:["Herodotus","Plato","Aristotle","Thucydides"], correctIndex:0 },
  { id:30, category:"history", difficulty:3, text:"What was the 1953 Iranian coup d'état about?", options:["The CIA/MI6 overthrow of PM Mosaddegh","A military rebellion","A student revolution","A royal succession conflict"], correctIndex:0 },

  // ── Geography ─────────────────────────────────────────────────────────────
  { id:31, category:"geography", difficulty:1, text:"What is the capital city of Iran?", options:["Tehran","Isfahan","Shiraz","Tabriz"], correctIndex:0 },
  { id:32, category:"geography", difficulty:2, text:"Which mountain range runs through northern Iran?", options:["Alborz (Elburz)","Zagros","Himalayas","Caucasus"], correctIndex:0 },
  { id:33, category:"geography", difficulty:1, text:"Which large body of water borders Iran to the north?", options:["Caspian Sea","Black Sea","Mediterranean Sea","Red Sea"], correctIndex:0 },
  { id:34, category:"geography", difficulty:2, text:"What is Iran's highest peak?", options:["Mount Damavand","Mount Dena","Mount Sabalan","Mount Tochal"], correctIndex:0 },
  { id:35, category:"geography", difficulty:3, text:"The Dasht-e Kavir is what type of geographical feature?", options:["A large salt desert","A mountain range","A river delta","A tropical forest"], correctIndex:0 },
  { id:36, category:"geography", difficulty:1, text:"Which gulf borders Iran to the south?", options:["Persian Gulf","Gulf of Aden","Gulf of Mexico","Gulf of Oman"], correctIndex:0 },
  { id:37, category:"geography", difficulty:2, text:"Which city is known as the 'City of Roses and Nightingales'?", options:["Shiraz","Isfahan","Tabriz","Yazd"], correctIndex:0 },
  { id:38, category:"geography", difficulty:3, text:"What is the area of Iran approximately?", options:["1.65 million km²","800,000 km²","2.5 million km²","500,000 km²"], correctIndex:0 },
  { id:39, category:"geography", difficulty:2, text:"Which Iranian city is famous for its historical bridges over the Zayandeh River?", options:["Isfahan","Tehran","Mashhad","Kerman"], correctIndex:0 },
  { id:40, category:"geography", difficulty:1, text:"How many countries share a land border with Iran?", options:["7","5","4","9"], correctIndex:0 },
  { id:41, category:"geography", difficulty:3, text:"Which island in the Persian Gulf is the largest Iranian island?", options:["Qeshm","Kish","Hormuz","Hengam"], correctIndex:0 },
  { id:42, category:"geography", difficulty:2, text:"The ancient city of Yazd is known for its unique architecture using what?", options:["Wind catchers (Badgir)","Underground tunnels","Floating foundations","Glass domes"], correctIndex:0 },
  { id:43, category:"geography", difficulty:2, text:"Which province is Iran's largest by area?", options:["Kerman","Isfahan","Khorasan","Fars"], correctIndex:0 },
  { id:44, category:"geography", difficulty:3, text:"The Karun is the most important what in Iran?", options:["River (the only navigable river)","Mountain pass","Highway","Railway"], correctIndex:0 },
  { id:45, category:"geography", difficulty:1, text:"What is the approximate population of Iran?", options:["~88 million","~50 million","~120 million","~35 million"], correctIndex:0 },

  // ── Famous People ──────────────────────────────────────────────────────────
  { id:46, category:"famous-people", difficulty:1, text:"Who wrote the Shahnameh?", options:["Ferdowsi","Hafez","Rumi","Saadi"], correctIndex:0 },
  { id:47, category:"famous-people", difficulty:1, text:"Which Persian poet wrote 'The Rubaiyat'?", options:["Omar Khayyam","Hafez","Rumi","Attar"], correctIndex:0 },
  { id:48, category:"famous-people", difficulty:2, text:"Who is Rumi?", options:["A 13th-century Persian poet and Sufi mystic","A king of Persia","A famous warrior","A Persian architect"], correctIndex:0 },
  { id:49, category:"famous-people", difficulty:2, text:"Which Iranian mathematician is called the 'Father of Algebra'?", options:["Al-Khwarizmi","Omar Khayyam","Avicenna","Biruni"], correctIndex:0 },
  { id:50, category:"famous-people", difficulty:3, text:"Who was Avicenna (Ibn Sina)?", options:["A Persian polymath and physician who wrote 'The Canon of Medicine'","A Persian king","A Sufi poet","A military commander"], correctIndex:0 },
  { id:51, category:"famous-people", difficulty:1, text:"Hafez is famous for being a what?", options:["Poet of lyrical ghazals","King","Scientist","Architect"], correctIndex:0 },
  { id:52, category:"famous-people", difficulty:2, text:"Which Iranian filmmaker won the Academy Award for 'A Separation'?", options:["Asghar Farhadi","Abbas Kiarostami","Majid Majidi","Jafar Panahi"], correctIndex:0 },
  { id:53, category:"famous-people", difficulty:3, text:"Maryam Mirzakhani was the first woman to win which prize?", options:["The Fields Medal (mathematics)","The Nobel Prize in Physics","The Pulitzer Prize","The Abel Prize"], correctIndex:0 },
  { id:54, category:"famous-people", difficulty:2, text:"Which Iranian chess player became a grandmaster at age 15?", options:["Alireza Firouzja","Ehsan Ghaem-Maghami","Parham Maghsoodloo","Amin Tabatabaei"], correctIndex:0 },
  { id:55, category:"famous-people", difficulty:1, text:"Saadi Shirazi is best known for which literary work?", options:["Gulistan (The Rose Garden)","Shahnameh","Rubaiyat","Masnavi"], correctIndex:0 },
  { id:56, category:"famous-people", difficulty:3, text:"Who was Abbas Kiarostami?", options:["An internationally acclaimed Iranian film director","A Persian classical musician","A revolutionary leader","A calligrapher"], correctIndex:0 },
  { id:57, category:"famous-people", difficulty:2, text:"Ali Daei held the world record for most international goals. How many did he score?", options:["109","100","95","120"], correctIndex:0 },
  { id:58, category:"famous-people", difficulty:1, text:"Which ancient Iranian prophet founded Zoroastrianism?", options:["Zarathustra (Zoroaster)","Mani","Mazdak","Cyrus"], correctIndex:0 },
  { id:59, category:"famous-people", difficulty:3, text:"Who was Naser al-Din Shah Qajar?", options:["A long-reigning Qajar king who introduced photography to Iran","The founder of the Qajar dynasty","A Safavid military leader","A Constitutional Revolution hero"], correctIndex:0 },
  { id:60, category:"famous-people", difficulty:2, text:"Which Iranian won the Nobel Peace Prize in 2003?", options:["Shirin Ebadi","Maryam Mirzakhani","Asghar Farhadi","Abbas Kiarostami"], correctIndex:0 },

  // ── Extra mixed ─────────────────────────────────────────────────────────────
  { id:61, category:"culture", difficulty:2, text:"What instrument is the 'tar' in Persian music?", options:["A long-necked string instrument","A drum","A flute","A wind instrument"], correctIndex:0 },
  { id:62, category:"history", difficulty:2, text:"The Constitutional Revolution of Iran happened in which decade?", options:["1900s (1905–1911)","1920s","1870s","1940s"], correctIndex:0 },
  { id:63, category:"geography", difficulty:2, text:"Which UNESCO World Heritage Site is a stepped garden in Shiraz?", options:["Eram Garden","Fin Garden","Shazdeh Garden","Dowlat Abad Garden"], correctIndex:0 },
  { id:64, category:"famous-people", difficulty:1, text:"Who is Ali Daei?", options:["A legendary Iranian football striker","A Persian poet","A political leader","A film director"], correctIndex:0 },
  { id:65, category:"history", difficulty:3, text:"What was the 'White Revolution' of 1963?", options:["Shah's modernization and land reform program","A military coup","A religious uprising","A student protest movement"], correctIndex:0 },
  { id:66, category:"geography", difficulty:2, text:"What is the Persian name for the Persian Gulf?", options:["Khalij-e Fars","Darya-ye Khazar","Daryacheh-ye Orumiyeh","Khalij-e Oman"], correctIndex:0 },
  { id:67, category:"culture", difficulty:3, text:"What is a 'qanat'?", options:["An ancient underground water channel system","A type of carpet","A musical instrument","A cooking method"], correctIndex:0 },
  { id:68, category:"famous-people", difficulty:1, text:"Which Persian poet's tomb is in Shiraz and is a major tourist site?", options:["Hafez","Rumi","Ferdowsi","Saadi"], correctIndex:0 },
  { id:69, category:"history", difficulty:2, text:"Persepolis was destroyed by which conqueror?", options:["Alexander the Great","Genghis Khan","Tamerlane","The Romans"], correctIndex:0 },
  { id:70, category:"geography", difficulty:3, text:"Lake Urmia in Iran was once one of the largest what in the world?", options:["Salt lakes","Freshwater lakes","Volcanic lakes","Artificial reservoirs"], correctIndex:0 },
  { id:71, category:"culture", difficulty:3, text:"What is 'Yalda Night'?", options:["Celebration of the longest night of the year (winter solstice)","A spring festival","A religious holiday","A harvest celebration"], correctIndex:0 },
  { id:72, category:"history", difficulty:1, text:"The Parthian Empire is also known as what?", options:["The Arsacid Empire","The Seleucid Empire","The Ottoman Empire","The Umayyad Empire"], correctIndex:0 },
  { id:73, category:"geography", difficulty:1, text:"Which city is the second-largest in Iran?", options:["Mashhad","Isfahan","Tabriz","Shiraz"], correctIndex:0 },
  { id:74, category:"famous-people", difficulty:2, text:"Who was Majid Majidi?", options:["An Iranian film director known for 'Children of Heaven'","A Persian poet","A football player","A mathematician"], correctIndex:0 },
  { id:75, category:"culture", difficulty:1, text:"What is 'Doogh'?", options:["A traditional yogurt-based drink","A type of bread","A dessert","A spice blend"], correctIndex:0 },
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

export const IranQuizView = () => {
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
      <div style={{ fontSize: isLive ? 72 : 54, marginBottom: 0 }}>🇮🇷</div>
      <h1 style={{
        fontSize: isLive ? 42 : 28, fontWeight: 900, margin: 0, textAlign: "center",
        background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.accent})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>Iran Quiz Arena</h1>
      <p style={{ color: COLORS.dimWhite, fontSize: isLive ? 18 : 13, margin: "4px 0 20px", textAlign: "center", maxWidth: 400 }}>
        Test your knowledge about Iran! History, culture, geography, and famous Persians. 🇮🇷
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {([["solo", "🇮🇷 Solo", "Play alone"], ["duel", "⚔️ Duel", "Local 2-player"], ["live-host", "📺 Live Host", "Big screen mode"]] as const).map(([m, label, sub]) => (
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
          Start Game 🇮🇷
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
              }}>Play Again 🇮🇷</button>
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
          🇮🇷 Iran Quiz Arena
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
  id: "iran-quiz",
  label: "iran-quiz",
  path: "/iran-quiz",
  icon: "shell:quiz",
  description: "home",
  tags: [""],
  permissions: [],
  features: [],
  visibility: ["private", "public"]
})
export class IranQuizPage extends React.Component {
  static contextType = EnvironmentContext;
  declare context: Environment;

  render() { //return <div> <CounterView/> <DemoView/></div>
    //return <CounterView/>
    return <IranQuizView/>
    //return  <FeatureRegistryVisualizer features={this.context.get(FeatureRegistry).filter((f) => f.parent == undefined)}></FeatureRegistryVisualizer>
  }
}