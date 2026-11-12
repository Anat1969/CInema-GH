import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, type Conv, type Msg, type RoomId } from "../api";
import { lesson, ROOM_ORDER, ROOMS, roomMeta } from "../data";
import { useJourney } from "../journey";
import { useLibrary } from "../library";
import { Crumbs, Pager } from "../nav";
import { Backdrop } from "./Scene";
import { ChatStage } from "./ChatStage";
import { EvolutionTab, NewTab, ViewsTab, type Sel } from "./RoomTabs";

type Tab = "chat" | "lesson" | "evolution" | "views" | "new";
const TABS: { id: Tab; label: string }[] = [
  { id: "chat", label: "שיחה" }, { id: "lesson", label: "שיעור" }, { id: "evolution", label: "אבולוציה" },
  { id: "views", label: "נקודות מבט" }, { id: "new", label: "תפיסה חדשה" },
];
const asTab = (t?: string): Tab => (TABS.some((x) => x.id === t) ? (t as Tab) : "chat");

export function RoomView({ id, tab: tabParam }: { id: RoomId; tab?: string }) {
  const room = roomMeta(id);
  const les = lesson(id);
  const tab = asTab(tabParam);
  const { convs, putConv, completed, ready } = useJourney();
  const { lib } = useLibrary();
  const [msgs, setMsgs] = useState<Msg[]>(convs[id]?.messages ?? []);
  const [insight, setInsight] = useState<string | null>(convs[id]?.worldview_insight ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [bg, setBg] = useState<number | null>(null);
  const [intro, setIntro] = useState(false);
  const [sel, setSel] = useState<Sel>([null, null]);
  const started = useRef("");

  const turns = msgs.filter((m) => m.role === "user").length;
  const progress = insight ? 1 : Math.min(turns / 6, 0.92);
  const auto = insight ? 4 : Math.min(turns, 3);
  const variant = bg ?? auto;

  useEffect(() => {
    if (!ready || started.current === id) return;
    started.current = id;
    const have = convs[id];
    setMsgs(have?.messages ?? []); setInsight(have?.worldview_insight ?? null);
    setBg(null); setError("");
    const fresh = !have || have.messages.filter((m) => m.role === "user").length === 0;
    setIntro(fresh && tab === "chat");
    if (!have || have.messages.length === 0) {
      api<{ messages: Msg[]; insight: string | null }>({ action: "chat", room: id })
        .then((r) => { setMsgs(r.messages); putConv({ room: id, messages: r.messages, worldview_insight: r.insight }); })
        .catch((e) => setError((e as Error).message));
    }
    if (fresh && tab === "chat") { const t = window.setTimeout(() => setIntro(false), 2600); return () => window.clearTimeout(t); }
  }, [id, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (text: string): Promise<boolean> => {
    setBusy(true); setError("");
    setMsgs((m) => [...m, { role: "user", content: text, timestamp: new Date().toISOString() }]);
    try {
      const r = await api<{ messages: Msg[]; insight: string | null; done: boolean }>({ action: "chat", room: id, message: text });
      setMsgs(r.messages); setInsight(r.insight);
      putConv({ room: id, messages: r.messages, worldview_insight: r.insight } as Conv);
      return true;
    } catch (e) {
      setMsgs((m) => m.slice(0, -1)); setError((e as Error).message);
      return false;
    } finally { setBusy(false); }
  };

  const next = useMemo(() => {
    const doneSet = new Set<string>([...completed, ...(insight ? [id] : [])]);
    const n = ROOMS.find((r) => !doneSet.has(r.id));
    return n ? { href: `#/room/${n.id}`, label: `לחדר הבא: ${n.name}` } : { href: "#/discovery", label: "לחדר הגילוי" };
  }, [completed, insight, id]);

  const i = ROOM_ORDER.indexOf(id);
  const prevRoom = i > 0 ? roomMeta(ROOM_ORDER[i - 1]) : null;
  const nextRoom = i < ROOM_ORDER.length - 1 ? roomMeta(ROOM_ORDER[i + 1]) : null;
  const suffix = tab === "chat" ? "" : `/${tab}`;
  const style = { ["--hue" as string]: room.hue, ["--soft" as string]: room.soft, ["--tint" as string]: room.tint, ["--deep" as string]: room.deep };

  return (
    <section className="room" style={style}>
      <AnimatePresence>
        {intro && (
          <motion.button key="intro" className="intro" onClick={() => setIntro(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
            <span className="mono">{room.name}</span>
            <h1>{room.question}</h1>
          </motion.button>
        )}
      </AnimatePresence>

      <header className="hero">
        <Backdrop room={room} variant={variant} p={progress} />
        <div className="hero-veil" />
        <div className="hero-in">
          <Crumbs items={[{ label: "בית", href: "#/" }, { label: "חדרים" }, { label: room.name }]} />
          <p className="mono">{room.name} · חלק מיצירה אחת של ארבעה חדרים</p>
          <h1 className="room-q">{room.question}</h1>
          <nav className="tabs" role="tablist" aria-label="שכבות החדר">
            {TABS.map((t) => (
              <a key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "on" : ""} href={`#/room/${id}${t.id === "chat" ? "" : "/" + t.id}`}>{t.label}</a>
            ))}
          </nav>
        </div>
      </header>

      <div className={`room-content tab-${tab}`}>
        {tab === "chat" && (
          <div className="chat-grid">
            <ChatStage draftKey={`kno_draft_${id}`} messages={msgs} busy={busy} error={error} done={!!insight}
              onSend={send} placeholder="כתבו כאן, או הקליטו. Ctrl+Enter לשליחה.">
              <p className="insight-label mono">התובנה של החדר</p>
              <p className="insight"><mark>{insight}</mark></p>
              <div className="row">
                <a className="btn primary" href={next.href}>{next.label}</a>
                <a className="btn soft" href={`#/room/${id}/views`}>לנקודות המבט של התחום</a>
              </div>
            </ChatStage>
            <aside className="trail" aria-label="התקדמות בחדר">
              <span className="mono">השיעור — {les.title}</span>
              <p className="trail-principle">{les.principle}</p>
              <div className="meter"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>
              <p>{insight ? "החדר הושלם" : turns === 0 ? "עוד לא ענית" : `${turns} תשובות`}</p>
              <p className="legend">האור בכותרת מתקדם עם השיחה.</p>
            </aside>
          </div>
        )}
        {tab === "lesson" && (
          <div className="lesson-grid">
            <article className="lesson">
              <p className="mono">שיעור — {les.title}</p>
              <h2 className="principle">{les.principle}</h2>
              <ol>{les.rules.map((r, k) => <li key={k}>{r}</li>)}</ol>
              <p className="anchor"><span className="tag">עוגן</span>{les.anchor}</p>
              <a className="btn primary" href={`#/room/${id}`}>להמשך השיחה</a>
            </article>
            <div className="gallery" role="group" aria-label="תמונות החדר">
              {les.images.map((im, k) => (
                <button key={im.kind} className={`thumb ${variant === k ? "on" : ""}`} onClick={() => setBg(k)} aria-label={im.title}>
                  <Backdrop room={room} variant={k} p={0.5} />
                  <span>{im.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {tab !== "chat" && tab !== "lesson" && !lib && <p className="muted">טוען את המאגר.</p>}
        {lib && tab === "evolution" && <EvolutionTab lib={lib} role={id} />}
        {lib && tab === "views" && <ViewsTab lib={lib} role={id} sel={sel} setSel={setSel} />}
        {lib && tab === "new" && <NewTab lib={lib} role={id} sel={sel} setSel={setSel} />}
      </div>

      <Pager
        prev={prevRoom ? { label: prevRoom.name, href: `#/room/${prevRoom.id}${suffix}` } : { label: "הכניסה", href: "#/" }}
        next={nextRoom ? { label: nextRoom.name, href: `#/room/${nextRoom.id}${suffix}` } : { label: "חדר הגילוי", href: "#/discovery" }}
        up={{ label: "כל ארבעת החדרים", href: "#/library" }}
      />
    </section>
  );
}
