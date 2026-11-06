"use client";
import { useSyncExternalStore } from "react";
import { musicState, subscribeMusic, toggleMusic } from "@/lib/music";

export default function MusicButton() {
  const state = useSyncExternalStore(subscribeMusic, musicState, () => "off" as const);
  if (state === "off") return null; // hidden on the envelope, where nothing is playing
  const on = state === "on";
  return (
    <button
      type="button"
      className={`music-btn${on ? " on" : " muted"}`}
      onClick={toggleMusic}
      aria-label={on ? "Mute music" : "Play music"}
      aria-pressed={on}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path className="spk" d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" />
        {!on && <path className="wave" d="M15.5 9.5l5 5M20.5 9.5l-5 5" />}
      </svg>
      {on && (
        <span className="music-bars" aria-hidden="true">
          <i /><i /><i />
        </span>
      )}
    </button>
  );
}