import { useEffect, useState } from "react";
import { DEV_CHAT, ROOMS } from "../data";
import { useJourney } from "../journey";

interface InstallEvent extends Event { prompt: () => Promise<void> }

export function TopBar({ route }: { route: string }) {
  const { completed, say } = useJourney();
  const [open, setOpen] = useState(false);
  const [install, setInstall] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setInstall(e as InstallEvent); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  useEffect(() => setOpen(false), [route]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(location.href); say("הקישור הועתק"); } catch { say("אי אפשר להעתיק כאן. סמנו את הכתובת."); }
    setOpen(false);
  };
  const all = completed.length === 4;
  return (
    <header className="topbar">
      <a className="brand" href="#/" aria-label="קולנועע, לדף הבית">קולנועע</a>
      <nav className="rooms-nav" aria-label="חדרים">
        {ROOMS.map((r) => (
          <a key={r.id} href={`#/room/${r.id}`} className={route === `room/${r.id}` ? "on" : ""} style={{ ["--hue" as string]: r.soft }}>
            <i className="dot" />{r.role}{completed.includes(r.id) && <span className="done-tag">הושלם</span>}
          </a>
        ))}
        <a href="#/discovery" className={`${route === "discovery" ? "on" : ""} ${all ? "" : "locked"}`}>הגילוי</a>
        <a href="#/library" className={route.startsWith("library") || route.startsWith("person") || route.startsWith("film") ? "on" : ""}>הספרייה</a>
      </nav>
      <button className="menu-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="תפריט">
        <span className="logo-mark" aria-hidden="true" /> תפריט
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-group">
            {ROOMS.map((r) => (<a key={r.id} href={`#/room/${r.id}`} role="menuitem">{r.name}</a>))}
            <a href="#/discovery" role="menuitem">חדר הגילוי</a>
            <a href="#/library" role="menuitem">הספרייה: אבולוציה ושיתופי פעולה</a>
            <a href="#/archive" role="menuitem">ארכיון הגילויים</a>
          </div>
          <div className="menu-group">
            <button onClick={copy} role="menuitem">העתקת קישור</button>
            <a href={DEV_CHAT} target="_blank" rel="noreferrer" role="menuitem">שיחת הפיתוח</a>
            <a href="#/prompts" role="menuitem">פרומפטים לתמונות החדרים</a>
            {install && <button role="menuitem" onClick={() => { void install.prompt(); setInstall(null); setOpen(false); }}>התקנת האפליקציה</button>}
          </div>
        </div>
      )}
    </header>
  );
}
