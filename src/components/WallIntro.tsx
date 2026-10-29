"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Start lights -> car drives across -> two panels slide open -> polaroids drop in.
// All timing lives in the CSS (wi-* rules). If you change it there, update the two timeouts below.
export default function WallIntro({ onDone }: { onDone: () => void }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone();
      return;
    }
    const t1 = window.setTimeout(() => setHidden(true), 9900); // panels are gone
    const t2 = window.setTimeout(onDone, 12500);               // polaroids finished dropping
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onDone]);

  if (hidden) return null;

  const stop = (e: React.TouchEvent) => e.stopPropagation(); // keep swipes from changing slides

  // rendered on <body>: the slides are transformed, which would misplace a fixed element
  return createPortal(
    <div className="wi" onTouchStart={stop} onTouchEnd={stop}>
      <div className="wi-curtain l" />
      <div className="wi-curtain r" />

      <div className="wi-stage" aria-hidden="true">
        <div className="wi-lights"><i className="wi-lamp" /><i className="wi-lamp" /><i className="wi-lamp" /></div>
        <div className="wi-say">
          <span className="wi-s1">Start your engines!</span>
          <span className="wi-s2">Let’s go!</span>
        </div>
        <div className="wi-road" />
        <div className="wi-car">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="wi-face" src="/enzo-face.png" alt="" />
        </div>
      </div>

      <button
        type="button"
        className="wi-skip"
        onClick={() => { setHidden(true); onDone(); }}
      >
        Skip ⏭
      </button>
    </div>,
    document.body
  );
}