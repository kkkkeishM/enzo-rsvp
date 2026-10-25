"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import BackButton from "./BackButton";

const WORDS = ["VROOM", "LUAN", "ZOOM", "ENZO", "LUAN" ,"1", "BEEP BEEP", "GO!", "VROOM VROOM", "1!", "ZOOM", "LUAN"];
const TITLE_WORDS = ["RACE", "DAY"];
const COLORS = ["#e63b2e", "#ffc928", "#1d4f91", "#15161c"];
const SOUNDS = ["beep!", "vroom!", "zoom!", "yay!", "1!"];
const HOLD_MS = 1300;
const HINT_IDLE = "Press and hold to open your invitation";

type Lane = { word: string; color: string; duration: number; delay: number; size: number };

function makeLanes(): Lane[] {
  return WORDS.map((word, i) => ({
    word,
    color: COLORS[i % COLORS.length],
    duration: 7 + Math.random() * 10,
    delay: Math.random() * 14,
    size: 6 + Math.random() * 6,
  }));
}


export default function Cover({ onEnter, onBack }: { onEnter: () => void; onBack: () => void  }) {
  const [lanes] = useState<Lane[]>(makeLanes);
  const [revving, setRevving] = useState(false);
  const [blast, setBlast] = useState(false);
  const [hint, setHint] = useState(HINT_IDLE);
  const [bubbles, setBubbles] = useState<{ id: number; letter: number; text: string }[]>([]);

  const holdTimer = useRef<number | null>(null);
  const done = useRef(false);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const bubbleId = useRef(0);

  useEffect(() => {
    return () => {
      if (holdTimer.current) window.clearTimeout(holdTimer.current);
    };
  }, []);

  function hopLetter(i: number) {
    letterRefs.current[i]?.animate(
      [
        { transform: "translateY(0) scale(1)" },
        { transform: "translateY(-60px) scale(.9,1.15)", offset: 0.4 },
        { transform: "translateY(0) scale(1)" },
      ],
      { duration: 500, easing: "ease-out" }
    );
    const id = ++bubbleId.current;
    const text = SOUNDS[Math.floor(Math.random() * SOUNDS.length)];
    setBubbles((b) => [...b, { id, letter: i, text }]);
    window.setTimeout(() => setBubbles((b) => b.filter((x) => x.id !== id)), 800);
  }

  function startRev() {
    if (done.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      done.current = true;
      onEnter();
      return;
    }
    setRevving(true);
    setHint("Keep holding!");
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      done.current = true;
      setBlast(true);
      setHint("Go go go!");
      window.setTimeout(onEnter, 450);
    }, HOLD_MS);
  }

  function stopRev() {
    if (done.current) return;
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    setRevving(false);
    setHint("Almost! Hold a little longer to rev up.");
  }

  function skip() {
    if (done.current) return;
    done.current = true;
    onEnter();
  }

  function goBack() {
    if (done.current) return;
    onBack();
  }

  return (
    <main className={`cover-screen${revving ? " revving" : ""}${blast ? " blast" : ""}`}>
      <div className="lanes" aria-hidden="true">
        {lanes.map((l, i) => (
          <div className="lane" key={i} style={{ top: `${3 + i * 10.8}%` }}>
            <span
              style={
                {
                  "--d": `${l.duration}s`,
                  color: l.color,
                  fontSize: `clamp(2.5rem, ${l.size}vw, 7rem)`,
                  animationDelay: `-${l.delay}s`,
                } as CSSProperties
              }
            >
              {l.word}
            </span>
          </div>
        ))}
      </div>

      <div className="cover-inner">
        <h1 className="title" aria-label="Race Day. Here we go!">
          <span className="letters" aria-hidden="true">
            {TITLE_WORDS.map((word, w) => (
              <span className="word" key={word}>
                {word.split("").map((ch, i) => {
                  // running index across both words, so every letter has its own ref, delay and bubble
                  const idx = TITLE_WORDS.slice(0, w).join("").length + i;
                  return (
                    <span
                      key={`${word}-${i}`}
                      className="ltr"
                      ref={(el) => {
                        letterRefs.current[idx] = el;
                      }}
                      style={{ "--i": idx } as CSSProperties}
                      onClick={() => hopLetter(idx)}
                    >
                      {ch}
                      {bubbles
                        .filter((b) => b.letter === idx)
                        .map((b) => (
                          <span key={b.id} className="bub">{b.text}</span>
                        ))}
                    </span>
                  );
                })}
              </span>
            ))}
          </span>
          <span className="sub" aria-hidden="true">Here we go!</span>
        </h1>

        <div className="poster">
          <Image src="/poster.png" alt="Enzo is turning 1! Start your engines." width={1121} height={522} priority />
        </div>

        <button
          className={`btn rev${revving ? " filling" : ""}`}
          type="button"
          onPointerDown={(e) => { e.preventDefault(); startRev(); }}
          onPointerUp={stopRev}
          onPointerLeave={stopRev}
          onPointerCancel={stopRev}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); startRev(); }
          }}
          onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") stopRev(); }}
        >
          <span>Hold to rev the engine!</span>
        </button>

        <p className="hint-bubble" key={hint} role="status">
        <span aria-hidden="true">
            {revving ? "🔥" : hint.startsWith("Almost") ? "😮" : "🏎️"}
        </span>{" "}
        {hint}
        </p>
        <button className="skip-btn" type="button" onClick={skip}>
        <span aria-hidden="true">🏁</span> Skip the rev
        </button>
      </div>
      <BackButton onClick={goBack} label="Back" />

    </main>
  );
}