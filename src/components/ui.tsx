import { roomMeta } from "../data";
import { pname, type LPerson } from "../library";

export function Face({ p, size = 44 }: { p: LPerson; size?: number }) {
  const m = roomMeta(p.roles[0]);
  return p.img
    ? <img className="face" src={p.img.src} alt="" width={size} height={size} loading="lazy" style={{ width: size, height: size }} />
    : <span className="face blank" style={{ width: size, height: size, background: m.tint, color: m.deep }}>{pname(p).main.slice(0, 1)}</span>;
}

// A museum-style mat around an image: white passe-partout, soft shadow, caption below.
export function Framed({ src, alt, caption, ratio = "4 / 5" }: { src: string; alt: string; caption?: React.ReactNode; ratio?: string }) {
  return (
    <figure className="framed">
      <div className="mat"><img src={src} alt={alt} loading="lazy" style={{ aspectRatio: ratio }} /></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
