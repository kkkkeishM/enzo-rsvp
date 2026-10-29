"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { WALL_PHOTOS, BLANK_CAPTIONS } from "@/lib/wall";

const SLOTS = 20;

type Slot = { src?: string; caption?: string };

const slots: Slot[] = Array.from({ length: SLOTS }, (_, i) => {
  const p = WALL_PHOTOS[i];
  if (!p) return { caption: BLANK_CAPTIONS[i % BLANK_CAPTIONS.length] };
  return typeof p === "string" ? { src: p } : { src: p.src, caption: p.caption };
});

function Cloud({ x, y, s, dur, delay }: { x: number; y: number; s: number; dur: number; delay: number }) {
  return (
    <g>
      <g transform={`translate(${x} ${y}) scale(${s})`} fill="#eef3f7">
        <ellipse cx="0" cy="26" rx="90" ry="26" />
        <circle cx="-34" cy="8" r="30" />
        <circle cx="12" cy="-6" r="40" />
        <circle cx="56" cy="12" r="28" />
      </g>
      <animateTransform attributeName="transform" type="translate" values="-14 0;14 0;-14 0" dur={`${dur}s`} begin={`-${delay}s`} repeatCount="indefinite" />
    </g>
  );
}

export default function PolaroidWall() {
  const [broken, setBroken] = useState<Set<number>>(() => new Set());
  const [zoom, setZoom] = useState<number | null>(null);

  return (
    <>
      {/* sky, sun, clouds and mesas: drawn right here, so there is no image file to lose */}
      <svg className="pw-sky" viewBox="0 0 400 850" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="pwsky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d4b78" />
            <stop offset=".6" stopColor="#4a85b5" />
            <stop offset="1" stopColor="#8dbfe3" />
          </linearGradient>
        </defs>
        <rect width="400" height="850" fill="url(#pwsky)" />
        <circle cx="352" cy="330" r="11" fill="#ffc928" />
        <Cloud x={50} y={520} s={0.9} dur={9} delay={2} />
        <Cloud x={355} y={790} s={0.8} dur={11} delay={5} />
        <Cloud x={330} y={140} s={0.5} dur={12} delay={7} />
        <path d="M30 850 L90 800 L250 800 L310 850 Z" fill="#f2a65a" />
        <path d="M230 850 L270 818 L350 818 L390 850 Z" fill="#e8924a" />
      </svg>

      <div className="pw">
        <div className="pw-strip" aria-hidden="true" />
        <div className="pw-grid" role="group" aria-label="Photos of Enzo">
          {slots.map((slot, i) => {
            const ok = !!slot.src && !broken.has(i); // a missing file falls back to an empty frame
            const caption = ok ? slot.caption : slot.caption ?? BLANK_CAPTIONS[i % BLANK_CAPTIONS.length];
            const style = {
              "--r": `${(((i * 37) % 13) - 6) * 0.8}deg`,
              "--tr": `${((i * 53) % 9) - 4}deg`,
              "--d": i,
            } as React.CSSProperties;
            const inner = (
              <>
                <span className={`pw-img${ok ? "" : " blank"}`}>
                  {ok && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slot.src}
                      alt={`Photo ${i + 1} of Enzo`}
                      loading="lazy"
                      decoding="async"
                      onError={() => setBroken((prev) => new Set(prev).add(i))}
                    />
                  )}
                </span>
                {caption && <span className="pw-cap">{caption}</span>}
              </>
            );
            return (
              <div className="pw-cell" key={i}>
                {ok ? (
                  <button type="button" className="pw-pol" style={style} onClick={() => setZoom(i)} aria-label={`Enlarge photo ${i + 1}`}>
                    {inner}
                  </button>
                ) : (
                  <div className="pw-pol" style={style} aria-hidden="true">{inner}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {zoom !== null &&
        slots[zoom]?.src &&
        createPortal(
          <div
            className="modal-back"
            onClick={() => setZoom(null)}
            onKeyDown={(e) => { if (e.key === "Escape") setZoom(null); e.stopPropagation(); }}
          >
            <div className="modal" role="dialog" aria-modal="true" aria-label="Photo of Enzo" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="zoom-img" src={slots[zoom].src} alt={`Photo ${zoom + 1} of Enzo`} />
              <div className="modal-actions">
                <button type="button" className="btn-sm" autoFocus onClick={() => setZoom(null)}>Close</button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}