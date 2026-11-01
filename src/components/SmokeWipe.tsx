"use client";
import type { CSSProperties } from "react";

type Phase = "idle" | "in" | "out";

// small puffs left behind the car along the bottom (x %); only used when the car is shown
const TRAIL_X = [8, 22, 36, 50, 64, 78, 92];

// big puffs that grow until the screen is covered: x %, y %, size (vw), delay (s)
const BLOOM = [
  [20, 15, 70, 0.55], [75, 12, 70, 0.7], [50, 35, 80, 0.6], [15, 50, 70, 0.8], [85, 48, 70, 0.65],
  [50, 62, 80, 0.9], [22, 80, 70, 0.75], [78, 82, 70, 0.95], [50, 95, 75, 1.0], [50, 8, 70, 0.85],
].map(([x, y, s, dl]) => ({ x, y, s, dl }));

export default function SmokeWipe({ phase, withCar = true }: { phase: Phase; withCar?: boolean }) {
  if (phase === "idle") return null;

  const puffs = withCar
    ? [...TRAIL_X.map((x) => ({ x, y: 86, s: 34, dl: +(x * 0.013).toFixed(2) })), ...BLOOM]
    : BLOOM.map((p) => ({ ...p, dl: +Math.max(0, p.dl - 0.5).toFixed(2) })); // no car: smoke starts right away

  return (
    <div className={`sw sw-${phase}${withCar ? "" : " sw-nocar"}`} aria-hidden="true">
      <div className="sw-fog" />
      {puffs.map((p, i) => (
        <span
          key={i}
          className="sw-puff"
          style={{
            left: `${p.x}%`, top: `${p.y}%`, width: `${p.s}vw`,
            "--dl": `${p.dl}s`, "--do": `${(i % 5) * 0.1}s`,
          } as CSSProperties}
        />
      ))}
      {withCar && phase === "in" && (
        <div className="sw-car">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="sw-carimg" src="/christening/car-bounce.gif" width={651} height={231} alt="" />
        </div>
      )}
    </div>
  );
}