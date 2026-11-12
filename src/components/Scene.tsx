import { useEffect, useState } from "react";
import type { RoomMeta } from "../data";

// Light scene built in code. It stands in for the Midjourney image until the file exists in public/rooms.
// `p` (0..1) is the progress of the conversation: the light bar moves and brightens as the room is explored.
export function Scene({ room, variant, p = 0.2 }: { room: RoomMeta; variant: number; p?: number }) {
  const id = `${room.id}-${variant}`;
  const glow = 0.28 + 0.55 * p;
  const shift = p * 150;
  return (
    <svg className="scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={room.hue} />
          <stop offset="0.6" stopColor="#0b0b10" />
          <stop offset="1" stopColor={room.hue} />
        </linearGradient>
        <linearGradient id={`bar-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F1E2B0" stopOpacity={glow} />
          <stop offset="1" stopColor="#F1E2B0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`floor-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d8d1c2" stopOpacity="0.02" />
          <stop offset="1" stopColor="#d8d1c2" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id={`gl-${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#F1E2B0" stopOpacity={glow * 0.8} />
          <stop offset="1" stopColor="#F1E2B0" stopOpacity="0" />
        </radialGradient>
        <filter id={`blur-${id}`}><feGaussianBlur stdDeviation="14" /></filter>
        <filter id={`soft-${id}`}><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <rect width="1600" height="900" fill={`url(#bg-${id})`} />
      <rect y="560" width="1600" height="340" fill={`url(#floor-${id})`} />
      
      {variant === 0 && (
        <>
          <rect x="140" y="250" width="620" height="330" fill="#f4efe3" opacity={0.08 + 0.22 * p}  filter={`url(#soft-${id})`} />
          <polygon points={`0,${300 - shift / 3} 140,260 ${620 + shift},640 ${300 + shift},720`} fill={`url(#bar-${id})`} filter={`url(#blur-${id})`} />
          <rect x="0" y="250" width="150" height="40" fill="#F1E2B0" opacity={0.15 + 0.5 * p} />
        </>
      )}
      {variant === 1 && (
        <>
          <rect x="120" y="300" width="440" height="280" fill="#f4efe3" opacity={0.1 + 0.15 * p}  filter={`url(#soft-${id})`} />
          <rect x="620" y="300" width="440" height="280" fill="#f4efe3" opacity={0.1 + 0.15 * p}  filter={`url(#soft-${id})`} />
          <rect x="740" y="350" width="200" height="130" fill="#F1E2B0" opacity={0.1 + 0.35 * p}  filter={`url(#soft-${id})`} />
          <circle cx="600" cy="440" r="320" fill={`url(#gl-${id})`} />
        </>
      )}
      {variant === 2 && (
        <>
          {[[260, 280, 1], [860, 280, -1], [260, 680, 1], [860, 680, -1]].map(([x, y, d], i) => (
            <path key={i} d={`M${x} ${y + (i < 2 ? 70 : -70)} L${x} ${y} L${x + d * 70} ${y}`} fill="none" stroke="#F1E2B0" strokeWidth="5" opacity={0.45 + 0.4 * p} />
          ))}
          <rect x="320" y="340" width="480" height="280" fill="#f4efe3" opacity={0.06 + 0.18 * p}  filter={`url(#soft-${id})`} />
          <circle cx="560" cy="480" r="340" fill={`url(#gl-${id})`} />
        </>
      )}
      {variant === 3 && (
        <>
          <polygon points={`${200 + shift},0 ${520 + shift},0 1100,900 ${620},900`} fill={`url(#bar-${id})`} filter={`url(#blur-${id})`} />
          <line x1="0" y1="780" x2="1600" y2="700" stroke="#d8d1c2" strokeOpacity="0.25" strokeWidth="3" />
          <line x1="0" y1="820" x2="1600" y2="744" stroke="#d8d1c2" strokeOpacity="0.18" strokeWidth="3" />
        </>
      )}
      {variant >= 4 && (
        <>
          <rect x="220" y="230" width="160" height="90" fill="#F1E2B0" opacity={0.2 + 0.6 * p}  filter={`url(#soft-${id})`} />
          <polygon points={`220,320 380,320 ${900 + shift},780 ${560 + shift},780`} fill={`url(#bar-${id})`} filter={`url(#blur-${id})`} />
        </>
      )}
      <rect width="1600" height="900" fill={room.hue} opacity="0.18" />
    </svg>
  );
}

const probe = new Map<string, boolean>();
export function useImageExists(src: string): boolean {
  const [ok, setOk] = useState<boolean>(probe.get(src) ?? false);
  useEffect(() => {
    if (probe.has(src)) { setOk(probe.get(src)!); return; }
    const img = new Image();
    img.onload = () => { probe.set(src, true); setOk(true); };
    img.onerror = () => { probe.set(src, false); setOk(false); };
    img.src = src;
  }, [src]);
  return ok;
}

// Real image when it exists, scene otherwise. Never an empty frame.
export function Backdrop({ room, variant, p }: { room: RoomMeta; variant: number; p?: number }) {
  const src = `/rooms/${room.id}/${variant}.jpg`;
  const has = useImageExists(src);
  return (
    <div className="backdrop" style={{ background: room.hue }}>
      {has ? <img className="backdrop-img" src={src} alt="" /> : <Scene room={room} variant={variant} p={p} />}
    </div>
  );
}
