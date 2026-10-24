"use client";
import { useEffect, useRef, useState } from "react";
import RaceCar from "./RaceCar";
import Image from "next/image"

export default function Envelope({ onOpened }: { onOpened: () => void }) {
  const [open, setOpen] = useState(false);
  const [present, setPresent] = useState(false);
  const tiltRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  function handleOpen() {
    if (open) return;
    setOpen(true);
    timers.current.push(window.setTimeout(() => setPresent(true), 1900));
    timers.current.push(window.setTimeout(onOpened, 2800));
  }

  function handleMove(e: React.PointerEvent) {
    if (!tiltRef.current) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    tiltRef.current.style.transform = `rotateY(${x * 4}deg) rotateX(${-y * 3}deg)`;
  }

  function handleLeave() {
    if (tiltRef.current) tiltRef.current.style.transform = "";
  }

  return (
    <main className="env-screen" onPointerMove={handleMove} onPointerLeave={handleLeave}>
      <div className={`env${open ? " open" : ""}${present ? " present" : ""}`}>
        <div className="env-tilt" ref={tiltRef}>
          <div className="env-stage">
            <div className="env-back" />

            <div className="env-card" aria-hidden="true">
            <i />
            <b>Enzo’s 1st Birthday Race Day</b>
            <Image
                className="env-tires"
                src="/rolling_lightyear_tires.gif"
                alt=""
                width={1366}
                height={727}
                unoptimized
            />
            </div>

            <div className="env-front" aria-hidden="true">
              <svg className="folds" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon points="0,0 50,55 0,100" fill="rgba(0,0,0,.10)" />
                <polygon points="100,0 50,55 100,100" fill="rgba(255,255,255,.07)" />
                <polygon points="0,100 50,55 100,100" fill="rgba(0,0,0,.14)" />
                <path d="M0 100 L50 55 L100 100" fill="none" stroke="rgba(0,0,0,.28)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>

            <svg className="env-fshadow" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polygon points="0,0 100,0 50,100" fill="rgba(0,0,0,.55)" />
            </svg>

            <div className="env-flap" aria-hidden="true">
              <span className="flap-t">You’re</span>
              <span className="flap-t">invited</span>

              <span className="flap-t">to</span>
            </div>

            <RaceCar className="env-car" />

            <button className="env-btn" type="button" onClick={handleOpen} aria-label="Open your invitation">
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <path d="M60 6 L22 56 H46 L38 94 L80 40 H56 Z" fill="#e63b2e" stroke="#8a2a12" strokeWidth="6" strokeLinejoin="round" />
              </svg>
              Open invitation
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}