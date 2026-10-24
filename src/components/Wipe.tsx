"use client";

export default function Wipe({ phase }: { phase: "idle" | "in" | "out" }) {
  return <div className={`wipe wipe-${phase}`} aria-hidden="true" />;
}