import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, type Conv, type Msg, type RoomId } from "../api";
import { lesson, ROOMS, roomMeta } from "../data";
import { useJourney } from "../journey";
import { Backdrop } from "./Scene";
import { ChatStage } from "./ChatStage";

type Mode = "ai" | "explore";

export function RoomView({ id }: { id: RoomId }) {
  const room = roomMeta(id);
  const les = lesson(id);
  const { convs, putConv, completed, ready } = useJourney();
  const [msgs, setMsgs] = useState<Msg[]>(convs[id]?.messages ?? []);
  const [insight, setInsight] = useState<string | null>(convs[id]?.worldview_insight ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("ai");
  const [bg, setBg] = useState<number | null>(null);
  const [intro, setIntro] = useState(false);
  const started = useRef("");

  const turns = msgs.filter((m) => m.role === "user").length;
  const progress = insight ? 1 : Math.min(turns / 6, 0.92);
  const auto = insight ? 4 : Math.min(turns, 3) === 0 ? 0 : Math.min(turns, 3);
  const variant = bg ?? auto;

  // Entering a room: the server returns (and stores) the fixed opening question.
  useEffect(() => {
    if (!ready || started.current === id) return;
    started.current = id;
    const have = convs[id];
    setMsgs(have?.messages ?? []); setInsight(have?.worldview_insight ?? null);
    setBg(null); setMode("ai"); setError("");
    const fresh = !have || have.messages.filter((m) => m.role === "user").length === 0;
    setIntro(fresh);
    if (!have || have.messages.length === 0) {
      api<{ messages: Msg[]; insight: string | null }>({ action: "chat", room: id })
        .then((r) => { setMsgs(r.messages); putConv({ room: id, messages: r.messages, worldview_insight: r.insight }); })
        .catch((e) => setError((e as Error).message));
    }
    if (fresh) { const t = window.setTimeout(() => setIntro(false), 2800); return () => window.clearTimeout(t); }
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

  return (
    <section className="room" style={{ ["--hue" as string]: room.hue, ["--soft" as string]: room.soft }}>
      <Backdrop room={room} variant={variant} p={progress} />
      <div className="room-shade" />
      <AnimatePresence>
        {intro && (
          <motion.button key="intro" className="intro" onClick={() => setIntro(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
            <span className="mono">{room.name}</span>
            <h1>{room.question}</h1>
          </motion.button>
        )}
      </AnimatePresence>

      <div className="room-head">
        <div>
          <span className="mono">{room.name}</span>
          <h1 className="room-q">{room.question}</h1>
        </div>
        <div className="mode" role="tablist" aria-label="מצב החדר">
          <button role="tab" aria-selected={mode === "ai"} className={mode === "ai" ? "on" : ""} onClick={() => setMode("ai")}>ב-AI</button>
          <button role="tab" aria-selected={mode === "explore"} className={mode === "explore" ? "on" : ""} onClick={() => setMode("explore")}>בחקירה</button>
        </div>
      </div>

      {mode === "ai" ? (
        <div className="room-body">
          <ChatStage
            draftKey={`kno_draft_${id}`} messages={msgs} busy={busy} error={error} done={!!insight}
            onSend={send} placeholder="כתבו כאן, או הקליטו. Ctrl+Enter לשליחה."
          >
            <p className="insight-label mono">התובנה של החדר</p>
            <p className="insight"><mark>{insight}</mark></p>
            <div className="row">
              <a className="btn primary" href={next.href}>{next.label}</a>
              <button className="btn soft" onClick={() => setMode("explore")}>לשיעור של החדר</button>
            </div>
          </ChatStage>
          <aside className="trail" aria-label="התקדמות בחדר">
            <span className="mono">השיעור — {les.title}</span>
            <p className="trail-principle">{les.principle}</p>
            <div className="meter"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>
            <p>{insight ? "החדר הושלם" : turns === 0 ? "עוד לא ענית" : `${turns} תשובות`}</p>
            <p className="legend">האור בחדר מתקדם עם השיחה.</p>
          </aside>
        </div>
      ) : (
        <div className="room-body explore">
          <article className="lesson">
            <p className="mono">שיעור — {les.title}</p>
            <h2 className="principle">{les.principle}</h2>
            <ol>{les.rules.map((r, i) => <li key={i}>{r}</li>)}</ol>
            <p className="anchor"><span className="tag">עוגן</span>{les.anchor}</p>
            <button className="btn primary" onClick={() => setMode("ai")}>להמשך השיחה</button>
          </article>
          <div className="gallery" role="group" aria-label="תמונות החדר">
            {les.images.map((im, i) => (
              <button key={im.kind} className={`thumb ${variant === i ? "on" : ""}`} onClick={() => setBg(i)} aria-label={im.title}>
                <Backdrop room={room} variant={i} p={0.5} />
                <span>{im.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
