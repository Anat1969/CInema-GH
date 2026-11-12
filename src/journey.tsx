import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type Conv, type Profile, type RoomId } from "./api";
import { ROOMS } from "./data";

interface Journey {
  ready: boolean; error: string | null;
  convs: Record<string, Conv>; profiles: Profile[]; completed: RoomId[];
  putConv: (c: Conv) => void; putProfile: (p: Profile) => void; reload: () => Promise<void>;
  toast: string; say: (t: string) => void;
}
const Ctx = createContext<Journey>(null!);
export const useJourney = () => useContext(Ctx);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convs, setConvs] = useState<Record<string, Conv>>({});
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [toast, setToast] = useState("");

  const reload = useCallback(async () => {
    try {
      const r = await api<{ conversations: Conv[]; profiles: Profile[] }>({ action: "start" });
      setConvs(Object.fromEntries(r.conversations.map((c) => [c.room, c])));
      setProfiles(r.profiles);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  const say = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(""), 2200);
  }, []);

  const value = useMemo<Journey>(() => ({
    ready, error, convs, profiles,
    completed: ROOMS.map((r) => r.id).filter((id) => convs[id]?.worldview_insight),
    putConv: (c) => setConvs((p) => ({ ...p, [c.room]: c })),
    putProfile: (pr) => setProfiles((p) => [pr, ...p.filter((x) => x.id !== pr.id)]),
    reload, toast, say,
  }), [ready, error, convs, profiles, reload, toast, say]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
