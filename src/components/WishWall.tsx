"use client";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import PolaroidWall from "./Polaroidwall";

type Wish = { id: string; author: string; message: string; at: string };
type Item = { key: string; wish: Wish };

const COLORS = ["#e63b2e", "#2f7fd8", "#2e9e4f", "#8e5bd6", "#f07a12", "#e0457b", "#139aa8"];
const MAX_WISHES_ON_WALL = 10; // keeps the sky from getting crowded; "See all" shows the rest
const POLL_MS = 20000;

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// every balloon gets its own (but always the same) position, speed and color
function balloonStyle(key: string): CSSProperties {
  const h = hash(key);
  return {
    "--x": h % 101,
    "--d": `${17 + ((h >> 4) % 12)}s`,
    "--s": `-${(h >> 8) % 26}s`,
    "--sw": `${3.8 + ((h >> 12) % 20) / 10}s`,
    "--c": COLORS[h % COLORS.length],
  } as CSSProperties;
}

export default function WishWall({
  active, refreshKey, note, onWrite,
}: {
  active: boolean;
  refreshKey: number;
  note?: string;
  onWrite: () => void;
}) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [read, setRead] = useState<Wish | null>(null);
  const [showAll, setShowAll] = useState(false);

  // load while this slide is on screen, and again every 20 seconds so new wishes appear
  useEffect(() => {
    if (!active) return;
    let stop = false;
    async function load() {
      try {
        const r = await fetch("/api/wishes", { cache: "no-store" });
        if (!r.ok) throw new Error("load failed");
        const d = await r.json();
        if (!stop) { setWishes(d.wishes ?? []); setFailed(false); }
      } catch {
        if (!stop) setFailed(true);
      } finally {
        if (!stop) setLoaded(true);
      }
    }
    load();
    const t = window.setInterval(load, POLL_MS);
    return () => { stop = true; window.clearInterval(t); };
  }, [active, refreshKey]);

  const items = useMemo<Item[]>(
    () => wishes.slice(0, MAX_WISHES_ON_WALL).map((w) => ({ key: w.id, wish: w })),
    [wishes]
  );

  return (
    <div className="wall">
      {/* the polaroid photo wall sits behind everything */}
      <PolaroidWall />

      {/* wish balloons float up in front of the photos */}
      {items.map((it) => (
        <div className="bl" key={it.key} style={balloonStyle(it.key)}>
          <div className="bl-sway">
            <button type="button" className="bl-body" onClick={() => setRead(it.wish)} aria-label={`Read the wish from ${it.wish.author}`}>
              <b>{it.wish.author}</b>
              <span>{it.wish.message}</span>
            </button>
            <i className="bl-knot" />
            <i className="bl-string" />
          </div>
        </div>
      ))}

      {/* plain list for screen readers */}
      <ul className="wall-sr">
        {wishes.map((w) => <li key={w.id}>{w.author}: {w.message}</li>)}
      </ul>

      <div className="wall-actions">
        <div className="wall-notes">
          {note && <p className="wall-note">{note}</p>}
          {failed && <p className="wall-note">Couldn’t load the wishes just now.</p>}
          {loaded && !failed && wishes.length === 0 && <p className="wall-note">No wishes yet. Be the first to send one for Enzo!</p>}
        </div>
       
        {wishes.length > 0 && (
          <button className="wall-link" type="button" onClick={() => setShowAll(true)}>See all {wishes.length} {wishes.length === 1 ? "wish" : "wishes"}</button>
        )}
      </div>

      {read &&
        createPortal(
          <div
            className="modal-back"
            onClick={() => setRead(null)}
            onKeyDown={(e) => { if (e.key === "Escape") setRead(null); e.stopPropagation(); }}
          >
            <div className="modal" role="dialog" aria-modal="true" aria-label={`Wish from ${read.author}`} onClick={(e) => e.stopPropagation()}>
              <h3>From {read.author}</h3>
              <p className="wish-full">{read.message}</p>
              <div className="modal-actions">
                <button type="button" className="btn-sm" autoFocus onClick={() => setRead(null)}>Close</button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {showAll &&
        createPortal(
          <div
            className="modal-back"
            onClick={() => setShowAll(false)}
            onKeyDown={(e) => { if (e.key === "Escape") setShowAll(false); e.stopPropagation(); }}
          >
            <div className="modal" role="dialog" aria-modal="true" aria-label="All wishes" onClick={(e) => e.stopPropagation()}>
              <h3>All birthday wishes</h3>
              <ul className="wish-list">
                {wishes.map((w) => (
                  <li key={w.id}><b>{w.author}</b><span>{w.message}</span></li>
                ))}
              </ul>
              <div className="modal-actions">
                <button type="button" className="btn-sm" autoFocus onClick={() => setShowAll(false)}>Close</button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}