import { useEffect, useState } from "react";
import { api, type PublicProfile } from "../api";
import { WorldviewPoster } from "./Discovery";

export function Shared({ token }: { token: string }) {
  const [p, setP] = useState<PublicProfile | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api<{ profile: PublicProfile }>({ action: "shared", token }).then((r) => setP(r.profile)).catch((e) => setErr((e as Error).message));
  }, [token]);
  if (err) return <section className="plain"><h1>{err}</h1><a className="btn primary" href="#/">לקולנועע</a></section>;
  if (!p) return <section className="plain"><p className="muted">טוען.</p></section>;
  return (
    <section className="discovery">
      <WorldviewPoster p={p} cta={
        <div className="row">
          {p.film_concept && <p className="shared-idea"><mark>{p.film_concept.idea}</mark></p>}
          <a className="btn primary" href="#/">גלו את תפיסת העולם שלכם</a>
        </div>
      } />
    </section>
  );
}
