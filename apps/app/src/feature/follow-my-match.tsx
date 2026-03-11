import React, { useState, useEffect, useRef, useCallback } from "react";
import { EnvironmentContext, Feature } from "@novx/portal";
import { Environment } from "@novx/core";

// ═══════════════════════════════════════════════════════════════════════════════
// ███ FOLLOW MY MATCH — Deutsche Telekom FIFA WM 2026 Companion ███
// Mobile-first SPA: Spiele-Übersicht, Match-View mit Stats/Ticker/Summary/Chat,
// Badge Marketplace, Social Sharing. Deutsch als Standardsprache.
// ═══════════════════════════════════════════════════════════════════════════════

// ── i18n ──────────────────────────────────────────────────────────────────────

type Lang = "de" | "en";
const translations: Record<Lang, Record<string, string>> = {
  de: {
    appTitle: "Follow My Match",
    liveNow: "Live Spiele",
    today: "Heute",
    upcoming: "Kommende Spiele",
    pastGames: "Vergangene Spiele",
    liveOnMagenta: "Live auf MagentaTV",
    joinMagenta: "Mitfiebern bei MagentaTV",
    stats: "Stats",
    ticker: "Live-Ticker",
    summary: "Zusammenfassung",
    chat: "Chat",
    badges: "Badges",
    back: "Zurück",
    share: "Teilen",
    goals: "Tore",
    shots: "Schüsse",
    possession: "Ballbesitz",
    yellowCards: "Gelbe Karten",
    redCards: "Rote Karten",
    subs: "Wechsel",
    min: "Min",
    preMatch: "Vor dem Spiel",
    fullTime: "Abpfiff",
    halftime: "Halbzeit",
    kickoff: "Anstoß",
    noEvents: "Noch keine Ereignisse.",
    summaryNeutral: "Neutral",
    summaryFan1: "Fan Heim",
    summaryFan2: "Fan Gast",
    summaryDrunk: "Nach 3 Bier 🍺",
    summaryKaiser: "Kaiser 👑",
    chatPlaceholder: "Dein Kommentar...",
    chatUsername: "Dein Name",
    chatSend: "Senden",
    chatNoLogin: "Kein Login nötig — einfach Name eingeben!",
    chatWait: "Bitte 30 Sek. warten",
    download: "Herunterladen",
    badgeTitle: "Badge Marketplace",
    finale: "Finale",
    groupStage: "Gruppenphase",
    noTicker: "Noch keine Ticker-Meldungen.",
    selectPerspective: "Perspektive wählen:",
    venue: "Spielort",
    switchLang: "EN",
    magentaUrl: "https://www.magentatv.de",
    games: "Spiele",
  },
  en: {
    appTitle: "Follow My Match",
    liveNow: "Live Matches",
    today: "Today",
    upcoming: "Upcoming Matches",
    pastGames: "Past Games",
    liveOnMagenta: "Live on MagentaTV",
    joinMagenta: "Join on MagentaTV",
    stats: "Stats",
    ticker: "Live Ticker",
    summary: "Summary",
    chat: "Chat",
    badges: "Badges",
    back: "Back",
    share: "Share",
    goals: "Goals",
    shots: "Shots",
    possession: "Possession",
    yellowCards: "Yellow Cards",
    redCards: "Red Cards",
    subs: "Substitutions",
    min: "min",
    preMatch: "Pre-Match",
    fullTime: "Full Time",
    halftime: "Half-time",
    kickoff: "Kick-off",
    noEvents: "No events yet.",
    summaryNeutral: "Neutral",
    summaryFan1: "Home Fan",
    summaryFan2: "Away Fan",
    summaryDrunk: "After 3 Beers 🍺",
    summaryKaiser: "Kaiser 👑",
    chatPlaceholder: "Your comment...",
    chatUsername: "Your name",
    chatSend: "Send",
    chatNoLogin: "No login required — just enter a name!",
    chatWait: "Please wait 30 sec",
    download: "Download",
    badgeTitle: "Badge Marketplace",
    finale: "Final",
    groupStage: "Group Stage",
    noTicker: "No ticker messages yet.",
    selectPerspective: "Choose perspective:",
    venue: "Venue",
    switchLang: "DE",
    magentaUrl: "https://www.magentatv.de",
    games: "Games",
  },
};

// ── Theme ─────────────────────────────────────────────────────────────────────

const C = {
  magenta: "#e20074",
  magentaDark: "#b0005c",
  magenta10: "rgba(226,0,116,0.10)",
  magenta06: "rgba(226,0,116,0.06)",
  white: "#ffffff",
  black: "#191919",
  bg: "#f5f5f5",
  card: "#ffffff",
  border: "#e6e6e6",
  gray: "#999999",
  grayDark: "#6c6c6c",
  red: "#d90000",
  green: "#00a550",
  yellow: "#ffbb00",
};
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const R = { sm: 8, md: 12, lg: 16 };

const KF = `
@keyframes fmm-pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes fmm-slide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Team { name: string; short: string; flag: string; color: string; }
interface MatchEvent { minute: number; type: string; team?: string; player?: string; assist?: string; playerIn?: string; playerOut?: string; detail: string; }
interface MatchStats { possession: [number, number]; shots: [number, number]; yellowCards: [number, number]; redCards: [number, number]; }
interface MatchLight { id: string; home: Team; away: Team; homeScore: number; awayScore: number; status: string; minute: number; date: string; time: string; venue: string; stage: string; group?: string; }
interface MatchFull extends MatchLight { events: MatchEvent[]; stats: MatchStats; ticker: string[]; }
interface ChatMsg { id: string; matchId: string; username: string; text: string; ts: number; }
interface Badge { id: string; type: string; label: string; color: string; match?: string; }

// ── API ───────────────────────────────────────────────────────────────────────

const API = "/api";

async function fetchMatches(status?: string): Promise<MatchLight[]> {
  const url = status ? `${API}/matches?status=${status}` : `${API}/matches`;
  const r = await fetch(url); return r.json();
}
async function fetchMatch(id: string): Promise<MatchFull> {
  const r = await fetch(`${API}/matches/${id}`); return r.json();
}
async function fetchSummary(id: string, perspective: string, lang: string): Promise<string> {
  const r = await fetch(`${API}/matches/${id}/summary?perspective=${perspective}&lang=${lang}`);
  const d = await r.json(); return d.text;
}
async function fetchBadges(): Promise<Badge[]> {
  const r = await fetch(`${API}/badges`); return r.json();
}

// ── Emoji Picker Data ─────────────────────────────────────────────────────────

const EMOJI_CATEGORIES = [
  { label: "👍", emojis: ["👍", "👎", "👏", "🙌", "💪", "🤝"] },
  { label: "❤️", emojis: ["❤️", "🔥", "💯", "😍", "🥰", "💔"] },
  { label: "😀", emojis: ["😀", "😂", "🤣", "😭", "😱", "🤯", "😤", "🥳", "🫣", "🤮"] },
  { label: "⚽", emojis: ["⚽", "🏆", "🥅", "🏟️", "🎯", "🥇", "🥈", "🥉", "🏅", "📣"] },
  { label: "🏳️", emojis: ["🇩🇪", "🇧🇷", "🇦🇷", "🇫🇷", "🇪🇸", "🇵🇹", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🇯🇵", "🇰🇷", "🇲🇦", "🇨🇭", "🇸🇳", "🇺🇸", "🇲🇽", "🇨🇦"] },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ███ MAIN APP COMPONENT ███
// ═══════════════════════════════════════════════════════════════════════════════

type AppView = "games" | "past" | "match" | "badges";

function FollowMyMatch() {
  const [lang, setLang] = useState<Lang>("de");
  const t = useCallback((key: string) => translations[lang][key] || key, [lang]);

  const [view, setView] = useState<AppView>("games");
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");

  const openMatch = (id: string) => { setSelectedMatchId(id); setView("match"); };
  const goBack = () => setView("games");

  return (
    <div style={{ minHeight: "100vh", maxWidth: 480, margin: "0 auto", background: C.bg, fontFamily: FONT, color: C.black, display: "flex", flexDirection: "column", paddingBottom: "env(safe-area-inset-bottom,0px)" }}>
      <style>{KF}</style>

      {/* ── Header ── */}
      <header style={{ background: C.magenta, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {view !== "games" && (
            <button onClick={goBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", padding: 4, minHeight: 36 }} aria-label={t("back")}>←</button>
          )}
          <span style={{ color: "#fff", fontSize: 15, fontWeight: 800, letterSpacing: -0.3 }}>⚽ {t("appTitle")}</span>
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 600 }}>Telekom</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Nav */}
          <button onClick={() => setView("games")} style={{ background: view === "games" ? "rgba(255,255,255,0.2)" : "none", border: "none", color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8, cursor: "pointer", minHeight: 32 }}>{t("games")}</button>
          <button onClick={() => setView("badges")} style={{ background: view === "badges" ? "rgba(255,255,255,0.2)" : "none", border: "none", color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8, cursor: "pointer", minHeight: 32 }}>{t("badges")}</button>
          {/* Lang Switcher */}
          <button onClick={() => setLang(lang === "de" ? "en" : "de")} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, cursor: "pointer", minHeight: 32 }}>{t("switchLang")}</button>
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
        {view === "games" && <GamesView t={t} lang={lang} openMatch={openMatch} setView={setView} />}
        {view === "past" && <PastGamesView t={t} lang={lang} openMatch={openMatch} goBack={goBack} />}
        {view === "match" && <MatchView t={t} lang={lang} matchId={selectedMatchId} />}
        {view === "badges" && <BadgeMarketplace t={t} />}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ███ GAMES VIEW (Landing Page) ███
// ═══════════════════════════════════════════════════════════════════════════════

function GamesView({ t, openMatch, setView }: { t: (k: string) => string; lang: Lang; openMatch: (id: string) => void; setView: (v: AppView) => void }) {
  const [matches, setMatches] = useState<MatchLight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches().then(m => { setMatches(m); setLoading(false); }).catch(() => setLoading(false));
    const iv = setInterval(() => { fetchMatches().then(setMatches).catch(() => { /* retry */ }); }, 15000);
    return () => clearInterval(iv);
  }, []);

  const live = matches.filter(m => m.status === "live");
  const upcoming = matches.filter(m => m.status === "upcoming");

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: C.gray }}><div style={{ fontSize: 36 }}>⚽</div><p style={{ fontSize: 14, fontWeight: 600 }}>Laden...</p></div>;

  return (
    <div style={{ padding: "12px 16px 32px" }}>
      {/* Live */}
      {live.length > 0 && (
        <section>
          <SectionHeader icon="🔴" text={t("liveNow")} count={live.length} />
          {live.map(m => <MatchCard key={m.id} m={m} t={t} onTap={() => openMatch(m.id)} isLive />)}
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section style={{ marginTop: 20 }}>
          <SectionHeader icon="⏳" text={t("upcoming")} />
          {upcoming.map(m => <MatchCard key={m.id} m={m} t={t} onTap={() => openMatch(m.id)} />)}
        </section>
      )}

      {/* Past link */}
      <button onClick={() => setView("past")} style={{ width: "100%", marginTop: 24, padding: "14px 16px", borderRadius: R.lg, border: `1px solid ${C.border}`, background: C.card, color: C.grayDark, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        📜 {t("pastGames")} →
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ███ PAST GAMES VIEW ███
// ═══════════════════════════════════════════════════════════════════════════════

function PastGamesView({ t, openMatch }: { t: (k: string) => string; lang: Lang; openMatch: (id: string) => void; goBack: () => void }) {
  const [matches, setMatches] = useState<MatchLight[]>([]);
  useEffect(() => { fetchMatches("past").then(setMatches).catch(() => { /* retry */ }); }, []);

  return (
    <div style={{ padding: "12px 16px 32px" }}>
      <SectionHeader icon="📜" text={t("pastGames")} />
      {matches.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.gray }}>Keine vergangenen Spiele.</div>}
      {matches.map(m => <MatchCard key={m.id} m={m} t={t} onTap={() => openMatch(m.id)} isPast />)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ███ MATCH CARD ███
// ═══════════════════════════════════════════════════════════════════════════════

function SectionHeader({ icon, text, count }: { icon: string; text: string; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 4 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>{text}</span>
      {count != null && <span style={{ fontSize: 12, color: C.gray }}>{count}</span>}
    </div>
  );
}

function MatchCard({ m, t, onTap, isLive, isPast }: { m: MatchLight; t: (k: string) => string; onTap: () => void; isLive?: boolean; isPast?: boolean }) {
  return (
    <button onClick={onTap} style={{ width: "100%", display: "flex", flexDirection: "column", background: C.card, border: `1px solid ${isLive ? C.magenta + "33" : C.border}`, borderRadius: R.lg, padding: 14, cursor: "pointer", textAlign: "left", marginBottom: 10, fontFamily: FONT, minHeight: 44, WebkitTapHighlightColor: "transparent" }}>
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: C.grayDark, textTransform: "uppercase", letterSpacing: 0.5 }}>{m.stage}{m.group ? ` — ${m.group}` : ""}</span>
        {isLive && <span style={{ fontSize: 10, fontWeight: 700, color: C.red, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, animation: "fmm-pulse 1.5s infinite" }} />LIVE {m.minute}'</span>}
      </div>
      {/* Teams row */}
      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 24 }}>{m.home.flag}</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{m.home.short}</span>
        </div>
        <div style={{ textAlign: "center", minWidth: 60 }}>
          {(isLive || isPast) ? (
            <div style={{ fontSize: 22, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{m.homeScore} : {m.awayScore}</div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 600, color: C.grayDark }}>{m.time}</div>
          )}
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{m.away.short}</span>
          <span style={{ fontSize: 24 }}>{m.away.flag}</span>
        </div>
      </div>
      {/* MagentaTV CTA */}
      <a href={t("magentaUrl")} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: C.magenta, textDecoration: "none", padding: "4px 10px", borderRadius: 8, background: C.magenta10, alignSelf: "flex-start" }}>
        📺 {isLive ? t("liveOnMagenta") : t("joinMagenta")}
      </a>
      {/* Venue */}
      <div style={{ marginTop: 6, fontSize: 10, color: C.gray }}>📍 {m.venue}</div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ███ MATCH VIEW ███
// ═══════════════════════════════════════════════════════════════════════════════

type MatchTab = "stats" | "ticker" | "summary" | "chat";

function MatchView({ t, lang, matchId }: { t: (k: string) => string; lang: Lang; matchId: string }) {
  const [match, setMatch] = useState<MatchFull | null>(null);
  const [tab, setTab] = useState<MatchTab>("stats");

  useEffect(() => {
    fetchMatch(matchId).then(setMatch).catch(() => {});
    const iv = setInterval(() => fetchMatch(matchId).then(setMatch).catch(() => {}), 10000);
    return () => clearInterval(iv);
  }, [matchId]);

  if (!match) return <div style={{ textAlign: "center", padding: 60, color: C.gray }}>⏳</div>;

  const isLive = match.status === "live";
  const isPast = match.status === "past";

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      {/* ── Scoreboard Header ── */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "14px 16px 12px" }}>
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.magenta, textTransform: "uppercase", letterSpacing: 1 }}>{match.stage}{match.group ? ` — ${match.group}` : ""}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 32 }}>{match.home.flag}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{match.home.short}</div>
          </div>
          <div style={{ textAlign: "center", minWidth: 80 }}>
            {match.status === "upcoming" ? (
              <div style={{ fontSize: 18, fontWeight: 700, color: C.grayDark }}>{match.time}<br /><span style={{ fontSize: 11 }}>{match.date}</span></div>
            ) : (
              <div style={{ fontSize: 32, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{match.homeScore} : {match.awayScore}</div>
            )}
            {isLive && <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: C.red, animation: "fmm-pulse 1.5s infinite" }} />{match.minute}'</div>}
            {isPast && <div style={{ fontSize: 11, color: C.grayDark, marginTop: 2 }}>{t("fullTime")}</div>}
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 32 }}>{match.away.flag}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{match.away.short}</div>
          </div>
        </div>
        {/* MagentaTV + Share */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10 }}>
          <a href={t("magentaUrl")} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 700, color: C.magenta, padding: "5px 12px", borderRadius: 8, background: C.magenta10, textDecoration: "none" }}>📺 {isLive ? t("liveOnMagenta") : t("joinMagenta")}</a>
          <button onClick={() => { try { navigator.share?.({ title: `${match.home.short} vs ${match.away.short}`, text: `${match.home.flag} ${match.homeScore}:${match.awayScore} ${match.away.flag} — Follow My Match`, url: window.location.href }); } catch {} }} style={{ fontSize: 11, fontWeight: 700, color: C.grayDark, padding: "5px 12px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, cursor: "pointer", minHeight: 32, fontFamily: FONT }}>🔗 {t("share")}</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.card, position: "sticky", top: 40, zIndex: 10 }}>
        {(["stats", "ticker", "summary", "chat"] as MatchTab[]).map(tb => {
          const icons: Record<MatchTab, string> = { stats: "📊", ticker: "📡", summary: "🤖", chat: "💬" };
          return (
            <button key={tb} onClick={() => setTab(tb)} style={{ flex: 1, padding: "8px 2px", border: "none", borderBottom: tab === tb ? `2.5px solid ${C.magenta}` : "2.5px solid transparent", background: tab === tb ? C.magenta06 : "transparent", color: tab === tb ? C.magenta : C.gray, cursor: "pointer", fontSize: 10, fontWeight: tab === tb ? 800 : 500, fontFamily: FONT, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minHeight: 44, justifyContent: "center" }}>
              <span style={{ fontSize: 15 }}>{icons[tb]}</span>
              <span>{t(tb)}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px 32px" }}>
        {tab === "stats" && <StatsTab match={match} t={t} />}
        {tab === "ticker" && <TickerTab match={match} t={t} />}
        {tab === "summary" && <SummaryTab match={match} t={t} lang={lang} />}
        {tab === "chat" && <ChatTab matchId={matchId} t={t} match={match} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ███ STATS TAB ███
// ═══════════════════════════════════════════════════════════════════════════════

function StatsTab({ match, t }: { match: MatchFull; t: (k: string) => string }) {
  const goals = match.events.filter(e => e.type === "goal");
  const subs = match.events.filter(e => e.type === "sub");
  const s = match.stats;

  if (match.status === "upcoming") return <div style={{ textAlign: "center", padding: 40, color: C.gray }}><div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>{t("preMatch")}</div>;

  return (
    <div>
      {/* Goals */}
      {goals.length > 0 && (
        <Card title={`⚽ ${t("goals")}`}>
          {goals.map((g, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < goals.length - 1 ? `1px solid ${C.bg}` : "none" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.magenta, minWidth: 30, textAlign: "right" }}>{g.minute}'</span>
              <span style={{ fontSize: 14 }}>{g.team === "home" ? match.home.flag : match.away.flag}</span>
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{g.player}{g.assist ? <span style={{ color: C.gray, fontWeight: 400 }}> ({g.assist})</span> : ""}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Subs */}
      {subs.length > 0 && (
        <Card title={`🔄 ${t("subs")}`}>
          {subs.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < subs.length - 1 ? `1px solid ${C.bg}` : "none" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.grayDark, minWidth: 30, textAlign: "right" }}>{s.minute}'</span>
              <span style={{ fontSize: 14 }}>{s.team === "home" ? match.home.flag : match.away.flag}</span>
              <span style={{ fontSize: 12, color: C.green }}>↑ {s.playerIn}</span>
              <span style={{ fontSize: 12, color: C.red }}>↓ {s.playerOut}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Stat Bars */}
      <Card title={`📊 ${t("stats")}`}>
        <StatBar label={t("possession")} home={s.possession[0]} away={s.possession[1]} fmt={v => v + "%"} hc={match.home.color} ac={match.away.color} />
        <StatBar label={t("shots")} home={s.shots[0]} away={s.shots[1]} hc={match.home.color} ac={match.away.color} />
        <StatBar label={t("yellowCards")} home={s.yellowCards[0]} away={s.yellowCards[1]} hc={C.yellow} ac={C.yellow} />
        <StatBar label={t("redCards")} home={s.redCards[0]} away={s.redCards[1]} hc={C.red} ac={C.red} />
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, borderRadius: R.lg, padding: 14, border: `1px solid ${C.border}`, marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.magenta, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function StatBar({ label, home, away, fmt, hc, ac }: { label: string; home: number; away: number; fmt?: (v: number) => string; hc: string; ac: string }) {
  const total = home + away || 1;
  const pct = (home / total) * 100;
  const format = fmt || String;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: C.grayDark, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ minWidth: 34, textAlign: "right", fontSize: 14, fontWeight: home > away ? 800 : 500, fontVariantNumeric: "tabular-nums", color: home > away ? hc : C.black }}>{format(home)}</span>
        <div style={{ flex: 1, display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: C.bg }}>
          <div style={{ width: `${pct}%`, background: hc, transition: "width .5s", borderRadius: "4px 0 0 4px" }} />
          <div style={{ width: `${100 - pct}%`, background: ac, transition: "width .5s", borderRadius: "0 4px 4px 0", opacity: 0.7 }} />
        </div>
        <span style={{ minWidth: 34, textAlign: "left", fontSize: 14, fontWeight: away > home ? 800 : 500, fontVariantNumeric: "tabular-nums", color: away > home ? ac : C.grayDark }}>{format(away)}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ███ TICKER TAB ███
// ═══════════════════════════════════════════════════════════════════════════════

function TickerTab({ match, t }: { match: MatchFull; t: (k: string) => string }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [match.ticker.length]);

  if (match.ticker.length === 0) return <div style={{ textAlign: "center", padding: 40, color: C.gray }}><div style={{ fontSize: 36, marginBottom: 8 }}>📡</div>{t("noTicker")}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {match.ticker.map((msg, i) => {
        const isGoal = msg.includes("TOOOR");
        return (
          <div key={i} style={{ padding: "10px 12px", borderRadius: R.md, background: isGoal ? "rgba(226,0,116,0.08)" : C.card, border: `1px solid ${isGoal ? C.magenta + "33" : C.border}`, fontSize: 13, lineHeight: 1.5, color: isGoal ? C.magenta : C.grayDark, fontWeight: isGoal ? 600 : 400, animation: i === match.ticker.length - 1 ? "fmm-slide .3s ease-out" : undefined }}>
            {msg}
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ███ SUMMARY TAB ███
// ═══════════════════════════════════════════════════════════════════════════════

const PERSPECTIVES = ["neutral", "fan1", "fan2", "drunk", "kaiser"] as const;

function SummaryTab({ match, t, lang }: { match: MatchFull; t: (k: string) => string; lang: Lang }) {
  const [perspective, setPerspective] = useState<string>("neutral");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchSummary(match.id, perspective, lang)
      .then(setText)
      .catch(() => setText("Fehler beim Laden."))
      .finally(() => setLoading(false));
  }, [match.id, perspective, lang]);

  if (match.status === "upcoming") return <div style={{ textAlign: "center", padding: 40, color: C.gray }}><div style={{ fontSize: 36, marginBottom: 8 }}>🤖</div>{t("preMatch")}</div>;

  const labels: Record<string, string> = { neutral: t("summaryNeutral"), fan1: t("summaryFan1"), fan2: t("summaryFan2"), drunk: t("summaryDrunk"), kaiser: t("summaryKaiser") };

  return (
    <div>
      {/* Perspective Switcher */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.grayDark, marginBottom: 6 }}>{t("selectPerspective")}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PERSPECTIVES.map(p => (
            <button key={p} onClick={() => setPerspective(p)} style={{ padding: "6px 12px", borderRadius: 20, border: perspective === p ? `2px solid ${C.magenta}` : `1px solid ${C.border}`, background: perspective === p ? C.magenta10 : C.card, color: perspective === p ? C.magenta : C.grayDark, fontSize: 12, fontWeight: perspective === p ? 700 : 500, cursor: "pointer", fontFamily: FONT, minHeight: 32 }}>
              {labels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Text */}
      <Card title={`🤖 ${labels[perspective]}`}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 20, color: C.gray }}>⏳ Generiere...</div>
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.7, color: C.black, whiteSpace: "pre-wrap" }}>{text}</div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ███ CHAT TAB (Twitch-Style) ███
// ═══════════════════════════════════════════════════════════════════════════════

function ChatTab({ matchId, t, match }: { matchId: string; t: (k: string) => string; match: MatchFull }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [username, setUsername] = useState(() => localStorage.getItem("fmm-username") || "");
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [canSend, setCanSend] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // WebSocket connection
  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${window.location.host}/ws/${matchId}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.type === "chat") setMessages(prev => [...prev, data.payload]);
        if (data.type === "history") setMessages(data.payload || []);
        if (data.type === "error") setError(data.payload);
      } catch {}
    };

    return () => { ws.close(); wsRef.current = null; };
  }, [matchId]);

  // Auto-scroll
  useEffect(() => { scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight); }, [messages.length]);

  const handleSend = () => {
    if (!text.trim() || !username.trim() || !wsRef.current || !canSend) return;
    localStorage.setItem("fmm-username", username);
    wsRef.current.send(JSON.stringify({ type: "chat", username: username.trim(), text: text.trim() }));
    setText("");
    setError("");
    setCanSend(false);
    setTimeout(() => setCanSend(true), 30000);
  };

  const insertEmoji = (emoji: string) => { setText(prev => prev + emoji); setShowEmoji(false); };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 420 }}>
      {/* Username input if not set */}
      {!username && (
        <div style={{ padding: 12, background: C.magenta06, borderRadius: R.md, marginBottom: 8, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: C.grayDark, marginBottom: 6 }}>{t("chatNoLogin")}</div>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder={t("chatUsername")} style={{ padding: "8px 12px", borderRadius: R.md, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: FONT, width: "100%", maxWidth: 200, minHeight: 44, background: C.card }} />
        </div>
      )}

      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, padding: "0 2px" }}>
        <span style={{ fontSize: 11, fontWeight: 600 }}>💬 {match.home.short} vs {match.away.short}</span>
        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 8, background: connected ? C.green + "18" : C.red + "18", color: connected ? C.green : C.red }}>{connected ? "● Live" : "○ ..."}</span>
      </div>

      {/* Messages (Twitch style) */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", background: C.black, borderRadius: R.md, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2, fontSize: 13 }}>
        {messages.length === 0 && <div style={{ textAlign: "center", color: "#666", padding: 20, fontSize: 12 }}>Noch keine Nachrichten 🎙️</div>}
        {messages.map(msg => (
          <div key={msg.id} style={{ animation: "fmm-slide .2s ease-out" }}>
            <span style={{ fontWeight: 700, color: C.magenta }}>{msg.username}</span>
            <span style={{ color: "#ccc" }}>: </span>
            <span style={{ color: "#eee", wordBreak: "break-word" }}>{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && <div style={{ fontSize: 11, color: C.red, padding: "4px 0" }}>⚠️ {error}</div>}

      {/* Emoji Picker */}
      {showEmoji && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: R.md, padding: 8, marginTop: 4, maxHeight: 150, overflowY: "auto" }}>
          {EMOJI_CATEGORIES.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 10, color: C.gray, fontWeight: 600, marginBottom: 2 }}>{cat.label}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {cat.emojis.map((e, ei) => (
                  <button key={ei} onClick={() => insertEmoji(e)} style={{ fontSize: 18, background: "none", border: "none", cursor: "pointer", padding: 2, minHeight: 28, borderRadius: 4 }}>{e}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
        {username && <span style={{ fontSize: 11, fontWeight: 600, color: C.magenta, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 60 }}>{username}</span>}
        <button onClick={() => setShowEmoji(!showEmoji)} style={{ fontSize: 18, background: "none", border: "none", cursor: "pointer", padding: 4, minHeight: 44 }}>😊</button>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder={t("chatPlaceholder")} maxLength={280} style={{ flex: 1, padding: "10px 12px", borderRadius: R.md, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: FONT, minHeight: 44, background: C.card }} />
        <button onClick={handleSend} disabled={!text.trim() || !username.trim() || !canSend} style={{ padding: "10px 14px", borderRadius: R.md, border: "none", fontWeight: 700, fontSize: 13, background: canSend && text.trim() && username.trim() ? C.magenta : C.bg, color: canSend && text.trim() && username.trim() ? "#fff" : C.gray, cursor: canSend ? "pointer" : "not-allowed", fontFamily: FONT, minHeight: 44 }}>
          {canSend ? t("chatSend") : "⏳"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ███ BADGE MARKETPLACE ███
// ═══════════════════════════════════════════════════════════════════════════════

function BadgeMarketplace({ t }: { t: (k: string) => string }) {
  const [badges, setBadges] = useState<Badge[]>([]);
  useEffect(() => { fetchBadges().then(setBadges).catch(() => {}); }, []);

  const downloadBadge = (badge: Badge) => {
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = "#e20074";
    ctx.fillRect(0, 0, 400, 400);

    // Inner circle
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(200, 180, 120, 0, Math.PI * 2); ctx.fill();

    // Badge text
    ctx.fillStyle = "#e20074";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badge.label, 200, 180);

    // T-Logo text
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("T", 200, 50);

    // Footer
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("Follow My Match · Telekom", 200, 360);

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `badge-${badge.id}.png`; a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div style={{ padding: "12px 16px 32px" }}>
      <SectionHeader icon="🏅" text={t("badgeTitle")} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {badges.map(b => (
          <button key={b.id} onClick={() => downloadBadge(b)} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 12, borderRadius: R.lg, background: C.card, border: `2px solid ${C.magenta}33`, cursor: "pointer", fontFamily: FONT, minHeight: 44 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${C.magenta}, ${C.magentaDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 6, color: "#fff" }}>
              {b.label.match(/[\p{Emoji_Presentation}\p{Emoji}\u200d]/u)?.[0] || "🏅"}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.black, textAlign: "center", lineHeight: 1.3, wordBreak: "break-word" }}>{b.label}</span>
            <span style={{ fontSize: 9, color: C.magenta, fontWeight: 700, marginTop: 4 }}>⬇️ {t("download")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ███ EXPORTED VIEW + FEATURE REGISTRATION ███
// ═══════════════════════════════════════════════════════════════════════════════

export const FollowMyMatchView = () => <FollowMyMatch />;

@Feature({
  id: "follow-my-match",
  label: "Follow My Match",
  path: "/follow-my-match",
  icon: "shell:soccer",
  description: "Deutsche Telekom FIFA WM 2026 Companion — Live Spiele, Stats, Ticker, Chat & Badges",
  tags: ["football", "worldcup", "telekom", "live"],
  permissions: [],
  features: [],
  visibility: ["private", "public"],
})
export class FollowMyMatchPage extends React.Component {
  static contextType = EnvironmentContext;
  declare context: Environment;

  render() {
    return <FollowMyMatchView />;
  }
}

