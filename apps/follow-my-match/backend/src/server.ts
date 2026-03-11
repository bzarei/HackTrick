// ═══════════════════════════════════════════════════════════════════════════════
// Follow My Match — Backend Server
// Express REST API + WebSocket Chat
// ═══════════════════════════════════════════════════════════════════════════════

import express, { Request, Response } from 'express';
import cors from 'cors';
import http, { IncomingMessage } from 'http';
import { WebSocketServer, WebSocket, RawData } from 'ws';

const PORT = Number(process.env.PORT) || 3003;
const app = express();
app.use(cors());
app.use(express.json());

// ── Types ─────────────────────────────────────────────────────────────────────

interface Team {
  name: string;
  short: string;
  flag: string;
  color: string;
}

interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow' | 'red' | 'sub' | 'half' | 'end' | 'kickoff' | 'var' | 'save' | 'corner' | 'penalty';
  team?: 'home' | 'away';
  player?: string;
  assist?: string;
  playerIn?: string;
  playerOut?: string;
  detail: string;
}

interface MatchStats {
  possession: [number, number];
  shots: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
}

type MatchStatus = 'live' | 'upcoming' | 'past';

interface Match {
  id: string;
  home: Team;
  away: Team;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  minute: number;
  date: string;
  time: string;
  venue: string;
  stage: string;
  group?: string;
  events: MatchEvent[];
  stats: MatchStats;
  ticker: string[];
}

interface ChatMsg {
  id: string;
  matchId: string;
  username: string;
  text: string;
  ts: number;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MATCHES: Match[] = [
  // LIVE
  {
    id: 'live-1',
    home: { name: 'Deutschland', short: 'GER', flag: '🇩🇪', color: '#000000' },
    away: { name: 'Japan', short: 'JPN', flag: '🇯🇵', color: '#bc002d' },
    homeScore: 1, awayScore: 2, status: 'live', minute: 72,
    date: '2026-06-12', time: '18:00', venue: 'MetLife Stadium, New York', stage: 'Gruppenphase', group: 'Gruppe E',
    events: [
      { minute: 1, type: 'kickoff', detail: 'Anpfiff in New York!' },
      { minute: 23, type: 'goal', team: 'home', player: 'I. Gündoğan', assist: 'J. Musiala', detail: 'TOOOR! Gündoğan bringt Deutschland in Führung!' },
      { minute: 35, type: 'yellow', team: 'away', player: 'W. Endo', detail: 'Gelbe Karte für hartes Einsteigen.' },
      { minute: 45, type: 'half', detail: 'Halbzeit.' },
      { minute: 55, type: 'sub', team: 'away', playerIn: 'R. Doan', playerOut: 'K. Mitoma', detail: 'Wechsel Japan: Doan kommt für Mitoma.' },
      { minute: 62, type: 'goal', team: 'away', player: 'T. Doan', detail: 'TOOOR! Doan gleicht für Japan aus!' },
      { minute: 68, type: 'goal', team: 'away', player: 'A. Tanaka', detail: 'TOOOR! Tanaka dreht das Spiel! Japan führt!' },
      { minute: 70, type: 'yellow', team: 'home', player: 'A. Rüdiger', detail: 'Gelbe Karte für Rüdiger.' },
    ],
    stats: { possession: [62, 38], shots: [14, 8], yellowCards: [1, 1], redCards: [0, 0] },
    ticker: [
      '1\' Anpfiff! Deutschland gegen Japan — los geht\'s!',
      '12\' Deutschland kontrolliert das Spiel, Japan lauert.',
      '23\' TOOOR! Gündoğan macht das 1:0 nach Musiala-Vorlage!',
      '35\' Gelbe Karte für Endo nach Foul an Kimmich.',
      '45\' Halbzeit: Deutschland führt verdient 1:0.',
      '55\' Wechsel Japan: Doan kommt für Mitoma.',
      '62\' TOOOR! Doan schiebt zum 1:1 ein! Japan kommt zurück!',
      '68\' TOOOR! Tanaka vollendet eine Ecke! 1:2 für Japan!',
      '70\' Gelbe Karte Rüdiger.',
      '72\' Deutschland drängt auf den Ausgleich...',
    ],
  },
  {
    id: 'live-2',
    home: { name: 'Brasilien', short: 'BRA', flag: '🇧🇷', color: '#009c3b' },
    away: { name: 'Südkorea', short: 'KOR', flag: '🇰🇷', color: '#003478' },
    homeScore: 3, awayScore: 0, status: 'live', minute: 38,
    date: '2026-06-12', time: '21:00', venue: 'Stadium 974, Doha', stage: 'Gruppenphase', group: 'Gruppe G',
    events: [
      { minute: 1, type: 'kickoff', detail: 'Anpfiff!' },
      { minute: 7, type: 'goal', team: 'home', player: 'Vinícius Jr.', detail: 'TOOOR! Vinícius Jr. tanzt sich durch!' },
      { minute: 13, type: 'goal', team: 'home', player: 'Neymar Jr.', detail: 'TOOOR! Neymar per Freistoß!' },
      { minute: 29, type: 'goal', team: 'home', player: 'Richarlison', detail: 'TOOOR! Richarlisons Fallrückzieher! Was ein Tor!' },
      { minute: 34, type: 'yellow', team: 'away', player: 'Kim M-j.', detail: 'Gelbe Karte für Kim.' },
    ],
    stats: { possession: [68, 32], shots: [15, 2], yellowCards: [0, 1], redCards: [0, 0] },
    ticker: [
      '1\' Anpfiff in Doha!',
      '7\' TOOOR! Vinícius Jr. — Brasilien führt früh!',
      '13\' TOOOR! Neymar mit einem Traumfreistoß! 2:0!',
      '29\' TOOOR! Richarlison mit dem Tor des Turniers! 3:0!',
      '34\' Gelbe Karte Kim Min-jae.',
      '38\' Brasilien spielt Südkorea schwindelig.',
    ],
  },
  // TODAY upcoming
  {
    id: 'today-1',
    home: { name: 'Argentinien', short: 'ARG', flag: '🇦🇷', color: '#75aadb' },
    away: { name: 'Frankreich', short: 'FRA', flag: '🇫🇷', color: '#003399' },
    homeScore: 0, awayScore: 0, status: 'upcoming', minute: 0,
    date: '2026-06-12', time: '21:00', venue: 'Lusail Stadium', stage: 'Gruppenphase', group: 'Gruppe C',
    events: [], stats: { possession: [0, 0], shots: [0, 0], yellowCards: [0, 0], redCards: [0, 0] },
    ticker: [],
  },
  // UPCOMING
  {
    id: 'up-1',
    home: { name: 'Spanien', short: 'ESP', flag: '🇪🇸', color: '#c60b1e' },
    away: { name: 'Marokko', short: 'MAR', flag: '🇲🇦', color: '#006233' },
    homeScore: 0, awayScore: 0, status: 'upcoming', minute: 0,
    date: '2026-06-13', time: '15:00', venue: 'Education City Stadium', stage: 'Gruppenphase', group: 'Gruppe B',
    events: [], stats: { possession: [0, 0], shots: [0, 0], yellowCards: [0, 0], redCards: [0, 0] },
    ticker: [],
  },
  {
    id: 'up-2',
    home: { name: 'Portugal', short: 'POR', flag: '🇵🇹', color: '#006600' },
    away: { name: 'Schweiz', short: 'SUI', flag: '🇨🇭', color: '#d52b1e' },
    homeScore: 0, awayScore: 0, status: 'upcoming', minute: 0,
    date: '2026-06-14', time: '18:00', venue: 'AT&T Stadium, Dallas', stage: 'Gruppenphase', group: 'Gruppe H',
    events: [], stats: { possession: [0, 0], shots: [0, 0], yellowCards: [0, 0], redCards: [0, 0] },
    ticker: [],
  },
  {
    id: 'up-3',
    home: { name: 'England', short: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#ffffff' },
    away: { name: 'Senegal', short: 'SEN', flag: '🇸🇳', color: '#00853f' },
    homeScore: 0, awayScore: 0, status: 'upcoming', minute: 0,
    date: '2026-06-15', time: '21:00', venue: 'SoFi Stadium, Los Angeles', stage: 'Gruppenphase', group: 'Gruppe D',
    events: [], stats: { possession: [0, 0], shots: [0, 0], yellowCards: [0, 0], redCards: [0, 0] },
    ticker: [],
  },
  {
    id: 'up-final',
    home: { name: 'TBD', short: '???', flag: '🏆', color: '#e20074' },
    away: { name: 'TBD', short: '???', flag: '🏆', color: '#e20074' },
    homeScore: 0, awayScore: 0, status: 'upcoming', minute: 0,
    date: '2026-07-19', time: '21:00', venue: 'MetLife Stadium, New York', stage: 'Finale',
    events: [], stats: { possession: [0, 0], shots: [0, 0], yellowCards: [0, 0], redCards: [0, 0] },
    ticker: [],
  },
  // PAST (WC 2022 results)
  {
    id: 'past-final',
    home: { name: 'Argentinien', short: 'ARG', flag: '🇦🇷', color: '#75aadb' },
    away: { name: 'Frankreich', short: 'FRA', flag: '🇫🇷', color: '#003399' },
    homeScore: 3, awayScore: 3, status: 'past', minute: 120,
    date: '2022-12-18', time: '16:00', venue: 'Lusail Stadium', stage: 'Finale',
    events: [
      { minute: 23, type: 'goal', team: 'home', player: 'L. Messi', assist: 'Á. Di María', detail: 'TOOOR! Messi verwandelt den Elfmeter!' },
      { minute: 36, type: 'goal', team: 'home', player: 'Á. Di María', assist: 'N. Molina', detail: 'TOOOR! Di María nach Traumkombination!' },
      { minute: 80, type: 'goal', team: 'away', player: 'K. Mbappé', detail: 'TOOOR! Mbappé verkürzt per Elfmeter!' },
      { minute: 81, type: 'goal', team: 'away', player: 'K. Mbappé', detail: 'TOOOR! Mbappé schon wieder! Doppelpack in 2 Minuten!' },
      { minute: 108, type: 'goal', team: 'home', player: 'L. Messi', detail: 'TOOOR! Messi in der Verlängerung!' },
      { minute: 118, type: 'goal', team: 'away', player: 'K. Mbappé', detail: 'TOOOR! Mbappé mit dem Hattrick per Elfmeter! 3:3!' },
    ],
    stats: { possession: [56, 44], shots: [12, 9], yellowCards: [2, 2], redCards: [0, 0] },
    ticker: ['23\' TOOOR! Messi — 1:0 ARG', '36\' TOOOR! Di María — 2:0 ARG', '80\' TOOOR! Mbappé — 2:1', '81\' TOOOR! Mbappé — 2:2!', '108\' TOOOR! Messi — 3:2 ARG', '118\' TOOOR! Mbappé Hattrick — 3:3!', 'Elfmeterschießen: Argentinien gewinnt 4:2!'],
  },
  {
    id: 'past-semi1',
    home: { name: 'Argentinien', short: 'ARG', flag: '🇦🇷', color: '#75aadb' },
    away: { name: 'Kroatien', short: 'CRO', flag: '🇭🇷', color: '#ff0000' },
    homeScore: 3, awayScore: 0, status: 'past', minute: 90,
    date: '2022-12-13', time: '20:00', venue: 'Lusail Stadium', stage: 'Halbfinale',
    events: [
      { minute: 34, type: 'goal', team: 'home', player: 'L. Messi', detail: 'TOOOR! Messi per Elfmeter!' },
      { minute: 39, type: 'goal', team: 'home', player: 'J. Álvarez', detail: 'TOOOR! Álvarez mit dem Solo-Lauf!' },
      { minute: 69, type: 'goal', team: 'home', player: 'J. Álvarez', detail: 'TOOOR! Álvarez nach Messi-Vorlage!' },
    ],
    stats: { possession: [42, 58], shots: [7, 4], yellowCards: [1, 3], redCards: [0, 0] },
    ticker: ['34\' TOOOR! Messi — 1:0', '39\' TOOOR! Álvarez — 2:0', '69\' TOOOR! Álvarez — 3:0'],
  },
  {
    id: 'past-semi2',
    home: { name: 'Frankreich', short: 'FRA', flag: '🇫🇷', color: '#003399' },
    away: { name: 'Marokko', short: 'MAR', flag: '🇲🇦', color: '#006233' },
    homeScore: 2, awayScore: 0, status: 'past', minute: 90,
    date: '2022-12-14', time: '20:00', venue: 'Al Bayt Stadium', stage: 'Halbfinale',
    events: [
      { minute: 5, type: 'goal', team: 'home', player: 'T. Hernández', detail: 'TOOOR! Hernández mit dem Traumtor!' },
      { minute: 79, type: 'goal', team: 'home', player: 'R. Kolo Muani', detail: 'TOOOR! Kolo Muani macht den Deckel drauf!' },
    ],
    stats: { possession: [34, 66], shots: [7, 5], yellowCards: [1, 2], redCards: [0, 0] },
    ticker: ['5\' TOOOR! Hernández — 1:0', '79\' TOOOR! Kolo Muani — 2:0'],
  },
];

// ── AI Summary Generation (Rule-Based, no external API needed) ────────────────

function generateSummary(matchId: string, perspective: string, lang: string): string {
  const m = MATCHES.find(x => x.id === matchId);
  if (!m) return lang === 'de' ? 'Spiel nicht gefunden.' : 'Match not found.';
  if (m.events.length === 0) return lang === 'de' ? 'Noch keine Spielereignisse vorhanden.' : 'No match events yet.';

  const goals = m.events.filter(e => e.type === 'goal');
  const homeGoals = goals.filter(g => g.team === 'home');
  const awayGoals = goals.filter(g => g.team === 'away');
  const scoreLine = `${m.home.flag} ${m.home.short} ${m.homeScore}:${m.awayScore} ${m.away.short} ${m.away.flag}`;

  if (perspective === 'fan1') {
    const team = m.home;
    if (m.homeScore > m.awayScore) return `🎉 JAAAAAA! Was für ein Spiel! ${team.flag} ${team.name} gewinnt ${scoreLine}! ${homeGoals.map(g => `⚽ ${g.player} (${g.minute}')`).join(', ')} — Unsere Jungs haben alles gegeben! Das ist UNSER Tag! 🏆`;
    if (m.homeScore < m.awayScore) return `😢 Bittere Niederlage... ${scoreLine}. ${team.name} hat gekämpft, aber heute war ${m.away.name} stärker. ${homeGoals.length > 0 ? `Immerhin ${homeGoals.map(g => `${g.player} (${g.minute}')`).join(', ')} mit Ehrentoren.` : 'Kein eigenes Tor, das schmerzt.'} Kopf hoch, nächstes Mal!`;
    return `😤 Unentschieden! ${scoreLine}. ${team.name} war so nah dran! ${homeGoals.map(g => `${g.player} (${g.minute}')`).join(', ')} haben getroffen, aber es hat nicht gereicht. Das fühlt sich wie eine verpasste Chance an!`;
  }
  if (perspective === 'fan2') {
    const team = m.away;
    if (m.awayScore > m.homeScore) return `🎉 YEEEES! ${team.flag} ${team.name} siegt! ${scoreLine}! ${awayGoals.map(g => `⚽ ${g.player} (${g.minute}')`).join(', ')} — Was für ein Triumph! 🏆`;
    if (m.awayScore < m.homeScore) return `😢 Leider verloren... ${scoreLine}. ${team.name} gibt nie auf! ${awayGoals.length > 0 ? `Wenigstens ${awayGoals.map(g => `${g.player} (${g.minute}')`).join(', ')}.` : ''} Nächstes Mal schlagen wir zurück!`;
    return `😤 Remis! ${scoreLine}. ${team.name} hat gut mitgehalten! ${awayGoals.map(g => `${g.player} (${g.minute}')`).join(', ')} — Weiter geht's!`;
  }
  if (perspective === 'drunk') {
    return `🍺🍺🍺 OOOOOH LEUDE! ${scoreLine}!! Habt ihr das geseeeehen?! ${goals.map(g => `${g.player} BOOOOM! (${g.minute}')`).join(' UND DANN ')}!! Ich kann nicht mehr! Noch ein Bier! Prost! 🍻 Bester Abend seit langem! Wo is mein Schal?! ${m.home.flag}${m.away.flag} FUSSBALL IST LEBEN!!! 🎉⚽🥳`;
  }
  if (perspective === 'kaiser') {
    return `Ja, meine Damen und Herren, ${scoreLine}. ${m.home.name} gegen ${m.away.name} — das war Fußball, wie er sein sollte. ${goals.length > 0 ? `Die Tore: ${goals.map(g => `${g.player} in der ${g.minute}. Minute`).join(', ')}.` : ''} In meiner Zeit hätten wir das vielleicht anders gelöst, aber man muss anerkennen — ${m.homeScore > m.awayScore ? m.home.name : m.awayScore > m.homeScore ? m.away.name : 'beide Mannschaften'} ha${m.homeScore === m.awayScore ? 'ben' : 't'} heute gezeigt, was Weltklasse bedeutet. So gehört sich das. Der Fußball braucht solche Abende. Punkt.`;
  }
  // neutral
  return `${scoreLine}\n\n${m.stage}${m.group ? ' — ' + m.group : ''}\n📍 ${m.venue}\n\n${goals.length > 0 ? 'Tore:\n' + goals.map(g => `⚽ ${g.minute}' ${g.player} (${g.team === 'home' ? m.home.short : m.away.short})`).join('\n') : 'Keine Tore.'}\n\nBallbesitz: ${m.stats.possession[0]}% — ${m.stats.possession[1]}%\nSchüsse: ${m.stats.shots[0]} — ${m.stats.shots[1]}`;
}

// ── Chat Service ──────────────────────────────────────────────────────────────

const chatRooms = new Map<string, Set<WebSocket>>();
const chatHistory = new Map<string, ChatMsg[]>();
const lastMsgTime = new Map<string, number>(); // username -> timestamp
let msgCounter = 0;

const BANNED_WORDS = ['hass', 'nazi', 'rassist', 'hurensohn', 'fick', 'scheiß', 'hate', 'racist', 'kill', 'die'];

function isClean(text: string): boolean {
  const lower = text.toLowerCase();
  return !BANNED_WORDS.some(w => lower.includes(w));
}

function canSend(username: string): boolean {
  const last = lastMsgTime.get(username) || 0;
  return Date.now() - last >= 30000;
}

function broadcastToRoom(matchId: string, msg: object) {
  const data = JSON.stringify(msg);
  chatRooms.get(matchId)?.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  });
}

// ── REST Routes ───────────────────────────────────────────────────────────────

// All matches (filter by ?status=live|upcoming|past)
app.get('/api/matches', (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  let list = MATCHES;
  if (status) list = list.filter(m => m.status === status);
  // return light version
  const light = list.map(({ events, ticker, stats, ...rest }) => rest);
  res.json(light);
});

// Single match full detail
app.get('/api/matches/:id', (req: Request, res: Response) => {
  const m = MATCHES.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Not found' });
  res.json(m);
});

// AI Summary
app.get('/api/matches/:id/summary', (req: Request, res: Response) => {
  const perspective = (req.query.perspective as string) || 'neutral';
  const lang = (req.query.lang as string) || 'de';
  const text = generateSummary(req.params.id, perspective, lang);
  res.json({ perspective, text });
});

// Badges
app.get('/api/badges', (_req: Request, res: Response) => {
  const badges = [
    { id: 'b1', type: 'flag', label: '🇩🇪 Deutschland', color: '#e20074' },
    { id: 'b2', type: 'flag', label: '🇧🇷 Brasilien', color: '#e20074' },
    { id: 'b3', type: 'flag', label: '🇦🇷 Argentinien', color: '#e20074' },
    { id: 'b4', type: 'flag', label: '🇫🇷 Frankreich', color: '#e20074' },
    { id: 'b5', type: 'flag', label: '🇪🇸 Spanien', color: '#e20074' },
    { id: 'b6', type: 'flag', label: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England', color: '#e20074' },
    { id: 'b7', type: 'flag', label: '🇵🇹 Portugal', color: '#e20074' },
    { id: 'b8', type: 'flag', label: '🇯🇵 Japan', color: '#e20074' },
    { id: 'b9', type: 'score', label: 'GER 1:2 JPN', match: 'live-1', color: '#e20074' },
    { id: 'b10', type: 'score', label: 'BRA 3:0 KOR', match: 'live-2', color: '#e20074' },
    { id: 'b11', type: 'scorer', label: '⚽ Gündoğan', color: '#e20074' },
    { id: 'b12', type: 'scorer', label: '⚽ Neymar Jr.', color: '#e20074' },
    { id: 'b13', type: 'scorer', label: '⚽ Vinícius Jr.', color: '#e20074' },
    { id: 'b14', type: 'scorer', label: '⚽ Mbappé', color: '#e20074' },
    { id: 'b15', type: 'scorer', label: '⚽ Messi', color: '#e20074' },
    { id: 'b16', type: 'wc', label: '🏆 WM 2026', color: '#e20074' },
    { id: 'b17', type: 'wc', label: '⚽ Follow My Match', color: '#e20074' },
    { id: 'b18', type: 'flag', label: '🇲🇦 Marokko', color: '#e20074' },
  ];
  res.json(badges);
});

// Health
app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

// ── WebSocket Chat ────────────────────────────────────────────────────────────

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const url = req.url || '';
  const parts = url.split('/').filter(Boolean);
  const matchId = parts.length >= 2 ? parts.slice(1).join('/') : '';

  if (!matchId) { ws.close(1008, 'Missing matchId'); return; }

  ws.on('error', (err: Error) => console.error(`[WS] Error: ${err.message}`));

  // Join room
  if (!chatRooms.has(matchId)) chatRooms.set(matchId, new Set());
  chatRooms.get(matchId)!.add(ws);

  // Send history
  const hist = chatHistory.get(matchId) || [];
  ws.send(JSON.stringify({ type: 'history', payload: hist }));

  ws.on('message', (raw: RawData) => {
    try {
      const data = JSON.parse(raw.toString());
      if (data.type === 'chat' && data.username && data.text) {
        const username = String(data.username).slice(0, 30);
        const text = String(data.text).slice(0, 280);

        // Spam check
        if (!canSend(username)) {
          ws.send(JSON.stringify({ type: 'error', payload: 'Bitte warte 30 Sekunden zwischen Nachrichten.' }));
          return;
        }
        // Hate speech check
        if (!isClean(text)) {
          ws.send(JSON.stringify({ type: 'error', payload: 'Deine Nachricht enthält unangemessene Inhalte.' }));
          return;
        }

        lastMsgTime.set(username, Date.now());
        const msg: ChatMsg = { id: `msg-${++msgCounter}`, matchId, username, text, ts: Date.now() };

        if (!chatHistory.has(matchId)) chatHistory.set(matchId, []);
        const h = chatHistory.get(matchId)!;
        h.push(msg);
        if (h.length > 200) h.shift();

        broadcastToRoom(matchId, { type: 'chat', payload: msg });
      }
    } catch { /* ignore */ }
  });

  ws.on('close', () => { chatRooms.get(matchId)?.delete(ws); });
});

// ── Live Simulation (advance minutes every 15s) ──────────────────────────────

setInterval(() => {
  for (const m of MATCHES) {
    if (m.status !== 'live') continue;
    if (m.minute < 90) m.minute++;
  }
}, 15000);

// ── Start ─────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`\n🏟️  Follow My Match Backend`);
  console.log(`   REST:      http://localhost:${PORT}/api/matches`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws/<matchId>`);
  console.log(`   Health:    http://localhost:${PORT}/api/health\n`);
});

