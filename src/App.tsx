import { useEffect, useState } from "react";
import { isRoom, type RoomMeta } from "./data";
import { JourneyProvider, useJourney } from "./journey";
import { TopBar } from "./components/TopBar";
import { Entrance } from "./components/Entrance";
import { RoomView } from "./components/RoomView";
import { Discovery } from "./components/Discovery";
import { Studio } from "./components/Studio";
import { Archive } from "./components/Archive";
import { Shared } from "./components/Shared";
import { Prompts } from "./components/Prompts";

const parse = () => (location.hash.replace(/^#\/?/, "") || "").split("?")[0];
export type { RoomMeta };

function Screen({ route }: { route: string }) {
  const [kind, arg] = route.split("/");
  if (kind === "room" && isRoom(arg ?? "")) return <RoomView key={arg} id={arg as never} />;
  if (kind === "discovery") return <Discovery />;
  if (kind === "studio" && arg) return <Studio key={arg} profileId={arg} />;
  if (kind === "archive") return <Archive />;
  if (kind === "s" && arg) return <Shared token={arg} />;
  if (kind === "prompts") return <Prompts />;
  return <Entrance />;
}

function Shell() {
  const [route, setRoute] = useState(parse());
  const { toast } = useJourney();
  useEffect(() => {
    const h = () => { setRoute(parse()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  return (
    <>
      <TopBar route={route} />
      <main id="main" className={`view v-${route.split("/")[0] || "home"}`}><Screen route={route} /></main>
      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </>
  );
}

export default function App() {
  return <JourneyProvider><Shell /></JourneyProvider>;
}
