"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { ensureTrack, stopMusic } from "@/lib/music";
import { createPortal } from "react-dom";
import { CHRISTENING as c, DETAILS, LETTER, greetingFor, directionsLinkFor, wazeLinkFor } from "@/lib/christening";
import { EVENT } from "@/lib/event";
import type { Godparent } from "./GodparentName";


// x %, y %, size px, twinkle seconds, delay seconds
const STARS: [number, number, number, number, number][] = [
  [6, 12, 16, 3, 0], [22, 5, 12, 2.6, 0.8], [38, 17, 18, 3.4, 1.6], [58, 4, 12, 2.8, 0.4],
  [74, 15, 14, 3.2, 1.2], [92, 8, 18, 3, 2], [12, 34, 12, 2.7, 1.9], [88, 31, 14, 3.5, 0.6],
  [30, 52, 12, 2.9, 2.4], [80, 56, 16, 3.1, 1], [8, 70, 14, 3.3, 1.4], [94, 78, 12, 2.6, 0.2],
  [48, 88, 14, 3, 1.7], [66, 70, 12, 2.8, 2.2],
];

const v = (o: Record<string, string | number>) => o as unknown as CSSProperties;

// y = top position, w = width px, d = seconds to cross the screen, dl = start offset (negative = already mid-screen)
function Cloud({ y, w, d, dl, o = 0.92 }: { y: string; w: number; d: number; dl: number; o?: number }) {
  return (
    <div className="fx-cloud" style={v({ "--y": y, "--w": `${w}px`, "--d": `${d}s`, "--dl": `${dl}s`, "--o": o })}>
      <svg viewBox="0 0 200 80" aria-hidden="true">
        <g fill="#fff">
          <ellipse cx="100" cy="58" rx="88" ry="18" />
          <circle cx="62" cy="46" r="24" />
          <circle cx="108" cy="36" r="32" />
          <circle cx="150" cy="50" r="20" />
        </g>
      </svg>
    </div>
  );
}

// x = left %, len = string length px, d = swing seconds, dl = start offset
const MOBILE: { x: number; len: number; d: number; dl: number; kind: "star" | "moon" | "cloud" }[] = [
    { x: 7, len: 34, d: 3.4, dl: 0, kind: "star" },
    { x: 19, len: 66, d: 4.1, dl: -1, kind: "moon" },
    { x: 31, len: 42, d: 3.8, dl: -2, kind: "cloud" },
    { x: 43, len: 74, d: 4.4, dl: -0.6, kind: "star" },
  ];
  
  function Pendant({ kind }: { kind: "star" | "moon" | "cloud" }) {
    return (
      <svg className="fx-pend" viewBox="0 0 28 28" aria-hidden="true">
        {kind === "star" && <polygon points="14,2 17.5,10.5 26,11 19.5,17 21.5,26 14,21 6.5,26 8.5,17 2,11 10.5,10.5" fill="#f7c948" stroke="#e0a82a" strokeWidth="1" strokeLinejoin="round" />}
        {kind === "moon" && <path d="M19 3a12 12 0 1 0 6 17 9 9 0 0 1-6-17z" fill="#f6d27a" stroke="#e0b44f" strokeWidth="1" />}
        {kind === "cloud" && (
          <g fill="#fff" stroke="#a9c3ea" strokeWidth="1">
            <ellipse cx="14" cy="19" rx="12" ry="6" />
            <circle cx="10" cy="15" r="5" />
            <circle cx="17" cy="13" r="6" />
          </g>
        )}
      </svg>
    );
  }
  

  export default function Christening({ onContinue, godparent }: { onContinue: () => void; godparent?: Godparent | null }) {
  const [dirOpen, setDirOpen] = useState(false);
  useEffect(() => { ensureTrack("christening"); }, []);
  return (
    <main className="cx-screen">
      <h1 className="cx-sr">Baptism of our son, Enzo Luan, November 21, 2026</h1>

      <div className="cx-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cx-img" src={c.image} width={1000} height={1410} alt={c.imageAlt} />
      </div>

      {/* baby photos on the left, over the background picture */}
      <div className="cx-photos">
      <div className="cx-ph cx-ph-round">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cx-pic" src="/christening/baby-round.png" width={254} height={277} alt="Enzo as a newborn" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cx-deco cx-d-gold" src="/christening/star-gold.png" width={160} height={168} alt="" aria-hidden="true" />
      </div>

      <div className="cx-ph cx-ph-pol">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cx-pic" src="/christening/baby-polaroid.png" width={268} height={379} alt="Enzo smiling" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cx-deco cx-d-b1" src="/christening/star-blue.png" width={160} height={150} alt="" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cx-deco cx-d-b2" src="/christening/star-blue.png" width={160} height={150} alt="" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cx-deco cx-d-b3" src="/christening/star-blue.png" width={160} height={150} alt="" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cx-deco cx-d-b4" src="/christening/star-blue.png" width={160} height={150} alt="" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cx-deco cx-d-feet" src="/christening/footprints.png" width={160} height={174} alt="" aria-hidden="true" />
      </div>
    </div>

    {/* letter from Enzo, right side */}
    <article className="cx-letter">
        <p className="cx-hello">{greetingFor(godparent)}</p>
          {LETTER.paragraphs.map((t, i) => (
        <p key={i} className={i === 0 ? "cx-first" : undefined}>{t}</p>
      ))}
      <p className="cx-sign">
        {LETTER.closing}
        <br />
        {LETTER.signature}
      </p>
    </article>

      {/* playful sky: clouds, twinkling stars, a flying sun and moons, shooting stars */}
      <div className="cx-fx" aria-hidden="true">
        <div className="fx-mobile">
            {MOBILE.map((m, i) => (
                <div key={i} className="fx-swing" style={v({ "--x": `${m.x}%`, "--len": `${m.len}px`, "--d": `${m.d}s`, "--dl": `${m.dl}s` })}>
                <i className="fx-line" />
                <Pendant kind={m.kind} />
                </div>
            ))}
            </div>

        {/* clouds above the picture */}
        <Cloud y="2%" w={170} d={95} dl={-30} o={0.85} />
        <Cloud y="13%" w={120} d={120} dl={-85} o={0.8} />

        {/* clouds in the space under the picture */}
        <div className="cx-below">
          <Cloud y="4%" w={190} d={80} dl={-20} />
          <Cloud y="38%" w={140} d={110} dl={-70} o={0.85} />
          <Cloud y="68%" w={210} d={90} dl={-50} />
        </div>

        <div className="fx-fly" style={v({ "--y": "5%", "--d": "56s", "--dl": "-14s" })}>
          <svg className="fx-sun" viewBox="0 0 60 60">
            <defs>
              <radialGradient id="cx-sunfill" cx="40%" cy="38%" r="70%"><stop offset="0" stopColor="#fff1a8" /><stop offset="1" stopColor="#ffbd2e" /></radialGradient>
            </defs>
            <g className="fx-rays" stroke="#ffc83d" strokeWidth="3" strokeLinecap="round">
              {Array.from({ length: 12 }, (_, i) => (
                <line key={i} x1="30" y1="4" x2="30" y2="10" transform={`rotate(${i * 30} 30 30)`} />
              ))}
            </g>
            <circle cx="30" cy="30" r="14" fill="url(#cx-sunfill)" />
            <circle cx="25" cy="28" r="1.8" fill="#b9701a" />
            <circle cx="35" cy="28" r="1.8" fill="#b9701a" />
            <path d="M24.5 34 Q30 39 35.5 34" fill="none" stroke="#b9701a" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div className="fx-fly" style={v({ "--y": "21%", "--d": "42s", "--dl": "-26s" })}>
          <span className="fx-moon" style={v({ "--s": "38px" })} />
        </div>
        <div className="fx-fly" style={v({ "--y": "47%", "--d": "68s", "--dl": "-44s" })}>
          <span className="fx-moon" style={v({ "--s": "26px" })} />
        </div>
        <div className="fx-fly" style={v({ "--y": "74%", "--d": "60s", "--dl": "-6s" })}>
          <span className="fx-moon" style={v({ "--s": "30px" })} />
        </div>

        <span className="fx-shoot" style={v({ "--x": "8%", "--y": "9%", "--dl": "1s" })} />
        <span className="fx-shoot" style={v({ "--x": "30%", "--y": "28%", "--dl": "5.5s" })} />
      </div>

      {/* bottom-left, under the picture */}
      <div className="cx-actions">
      <button type="button" className="cx-info" onClick={() => setDirOpen(true)} aria-haspopup="dialog">
        <span className="cx-row"><span className="cx-ei" aria-hidden="true">📅</span> {DETAILS.date}</span>
        <span className="cx-row"><span className="cx-ei" aria-hidden="true">🕗</span> {DETAILS.time}</span>
        <span className="cx-tap">
          <span className="cx-ico" aria-hidden="true">📍</span> Tap for venue directions <span aria-hidden="true">›</span>
        </span>
      </button>
        <button type="button" className="cx-go" onClick={() => { stopMusic(); onContinue(); }}>   
        <span className="cx-ico" aria-hidden="true">🎂</span> {c.continueLabel} <span aria-hidden="true">›</span>
        </button>
        <p className="cx-after">We look forward to sharing this special day with you.</p>
      </div>
      {dirOpen &&
        createPortal(
          <div
            className="modal-back"
            onClick={() => setDirOpen(false)}
            onKeyDown={(e) => { if (e.key === "Escape") setDirOpen(false); e.stopPropagation(); }}
          >
            <div className="modal cx-modal" role="dialog" aria-modal="true" aria-labelledby="cx-dir-title" onClick={(e) => e.stopPropagation()}>
              <h3 id="cx-dir-title">Get directions</h3>
              <p className="cx-modal-venue">{DETAILS.venue}</p>
              <p className="cx-modal-addr">{DETAILS.address}</p>
              <div className="cx-dirs">
                <a className="cx-dir" href={directionsLinkFor(c.mapsQuery)} target="_blank" rel="noopener noreferrer">
                  <span className="cx-ico" aria-hidden="true">📍</span> {c.directionsLabel}
                </a>
                <a className="cx-dir cx-dir-waze" href={wazeLinkFor(c.mapsQuery)} target="_blank" rel="noopener noreferrer">
                  <span className="cx-ico" aria-hidden="true">🚗</span> {c.wazeLabel}
                </a>
              </div>
              <div className="modal-card">   {/* the white card */}
                <button
                  type="button"
                  className="modal-close"
                  aria-label="Close"
                  onClick={() => setDirOpen(false)}
                >
                  ×
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </main>
  );
}