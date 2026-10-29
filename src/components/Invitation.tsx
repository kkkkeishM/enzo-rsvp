"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import WallIntro from "./WallIntro";
import RsvpForm from "./RsvpForm";
import WishDialog from "./WishDialog";
import WishWall from "./WishWall";
import { EVENT, GIFTS, googleDirections, wazeDirections } from "@/lib/event";

const LAST = 4;

const Arrow = ({ dir }: { dir: "left" | "right" }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={dir === "left" ? "M14.5 5.5 L8 12 L14.5 18.5" : "M9.5 5.5 L16 12 L9.5 18.5"} />
  </svg>
);

export default function Invitation({ onBack }: { onBack: () => void }) {
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [wallIntroDone, setWallIntroDone] = useState(false);
  const finishIntro = useCallback(() => setWallIntroDone(true), []);
  const [wish, setWish] = useState<{ open: boolean; name: string }>({ open: false, name: "" });
  const [wallKey, setWallKey] = useState(0);
  const [wished, setWished] = useState(false);
  const [wallNote, setWallNote] = useState("");
  const [wallOpen, setWallOpen] = useState(false);
  
  

  const next = () => setI((v) => (v === 3 && !wallOpen ? v : Math.min(v + 1, LAST)));
  const prev = () => (i === 0 ? onBack() : setI((v) => v - 1));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (e.key === "ArrowRight") setI((v) => (v === 3 && !wallOpen ? v : Math.min(v + 1, LAST)));
      if (e.key === "ArrowLeft") setI((v) => Math.max(v - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wallOpen]);

  useEffect(() => {
    if (i !== 4) setWallIntroDone(false);
  }, [i]);

  const giftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!giftOpen) return;
    const el = giftRef.current;
    if (el) el.scrollTop = 0;
    const id = requestAnimationFrame(() => { if (giftRef.current) giftRef.current.scrollTop = 0; });
    return () => cancelAnimationFrame(id);
  }, [giftOpen]);

  const sp = (n: number) => ({
    className: `slide bg-${n + 1}${i === n ? " active" : ""}`,
    inert: i !== n,
    "aria-hidden": i !== n,
  });

 

  return (
    <main
      className="invite-screen"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (dx < -60) next();
        if (dx > 60 && i > 0) prev();
      }}
    >
      <div className="slides" style={{ transform: `translateX(-${i * 100}%)` }}>
        {/* Slide 1: welcome + schedule */}
        <section {...sp(0)}>
          <div className="slide-body combo">
            <header className="inv-hero">
              <div className="pill">You’re invited!</div>
              <h1>{EVENT.title}</h1>
              <p className="inv-sub">{EVENT.subtitle}</p>
              <p>{EVENT.tagline}</p>
            </header>

            <div className="details-titles">
              <h2>Birthday Celebration Details</h2>
              <dl className="board">
                <div><dt>Date:</dt><dd>{EVENT.dateLabel}</dd></div>
                {EVENT.schedule.map((s) => (
                  <div key={s.label}><dt>{s.label}</dt><dd>{s.time}</dd></div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Slide 2: location */}
        <section {...sp(1)}>
          <div className="slide-body">
            <h2>Venue</h2>
            <div className="card">
              <div className="route" aria-hidden="true" />
              <p className="venue-text">
                <span className="venue-name">{EVENT.venue}</span>
                <br />
                <span className="venue-address">{EVENT.address}</span>
              </p>
              <div className="dir-links">
                <a className="link" href={googleDirections(EVENT.address)} target="_blank" rel="noopener noreferrer">
                  Google Maps
                </a>
                <a className="link waze" href={wazeDirections(EVENT.address)} target="_blank" rel="noopener noreferrer">
                  Waze
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Slide 3: dress code + parking */}
        <section {...sp(2)}>
          <div className="slide-body stack">
            <div className="card">
              <h3>Dress code</h3>
              <ul className="swatches">
                {EVENT.dressColors.map((c) => (
                  <li key={c.name}>
                    <span className="swatch" style={{ background: c.hex }} aria-hidden="true" />
                    {c.name}
                  </li>
                ))}
              </ul>
              <p>{EVENT.dressNote}</p>
            </div>

            <div className="card">
              <h3>Parking &amp; Arrival</h3>
              <p>{EVENT.parking}</p>
              <p className="arrive">{EVENT.arrival}</p>
            </div>
            <div className="card gift-card">
              <h3>Gift ideas</h3>
              <p>Your presence is the best gift! Curious what Enzo could use?</p>
              <button type="button" className="btn-sm" onClick={() => setGiftOpen(true)}>
                🎁 See gift ideas
              </button>
            </div>
          </div>
        </section>

        {/* Slide 4: RSVP */}
        <section {...sp(3)}>
          <div className="slide-body">
          <RsvpForm
              heading="Be Part of the Fun"
              onWrite={(name) => setWish({ open: true, name })}
              wished={wished}
              onOpenWall={() => { setWallOpen(true); setI(4); }}
            />
          </div>
        </section>

        {/* Slide 5: birthday wish wall */}
        <section {...sp(4)} className={`${sp(4).className} wall-slide${i === 4 && !wallIntroDone ? " intro-run" : ""}`}>
          <div className="slide-body">
            <h2 className="wall-title">Birthday Wish Wall</h2>
            <WishWall
              active={i === 4}
              refreshKey={wallKey}
              note={wallNote}
              onWrite={() => setWish({ open: true, name: "" })}
            />
          </div>
        </section>
      </div>

      <nav className="slide-nav" aria-label="Invitation navigation">
        <button className="nav-back" type="button" onClick={prev}>
          <Arrow dir="left" /> Back
        </button>
        <div className="dots">
        {Array.from({ length: wallOpen ? LAST + 1 : LAST }, (_, n) => (
            <button
              key={n}
              type="button"
              className={`dot${n === i ? " on" : ""}`}
              onClick={() => setI(n)}
              aria-label={`Go to slide ${n + 1}`}
              aria-current={n === i}
            />
          ))}
        </div>
        {i < LAST && i !== 3 ? (
          <button className="nav-next" type="button" onClick={next}>
            Next <Arrow dir="right" />
          </button>
        ) : (
          <span />
        )}
      </nav>
      

      {giftOpen &&
        createPortal(
          <div
            className="modal-back"
            onClick={() => setGiftOpen(false)}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setGiftOpen(false);
              e.stopPropagation();
            }}
          >
            <div
              className="modal gift-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="gift-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="gift-title">🎁 {GIFTS.title}</h3>
              <p className="gift-intro">{GIFTS.intro}</p>
              <ul className="gift-list">
                {GIFTS.ideas.map((g) => (
                  <li key={g.title}>
                    <span className="gift-emoji" aria-hidden="true">{g.emoji}</span>
                    <div>
                      <b>{g.title}</b>
                      <p>{g.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="gift-outro">{GIFTS.outro}</p>
              <div className="modal-actions">
                <button type="button" className="btn-sm" onClick={() => setGiftOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {i === 4 && !wallIntroDone && <WallIntro onDone={finishIntro} />}   

      <WishDialog
        open={wish.open}
        initialName={wish.name}
        onClose={() => setWish({ open: false, name: "" })}
        onSent={(pending) => {
          setWallOpen(true); setI(4);
          setWished(true);
          setWish({ open: false, name: "" });
          setWallNote(pending ? "Thank you! Your wish will float up once it’s approved." : "");
          setWallKey((k) => k + 1);
          setI(4);
        }}
      />
    </main>
  );
}