export type Track = "christening" | "birthday";

const SRC: Record<Track, string> = {
  christening: "/christening.mp3",
  birthday: "/music.mp3",
};

const audios: Partial<Record<Track, HTMLAudioElement>> = {};
let current: Track | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function get(t: Track) {
  let a = audios[t];
  if (!a) {
    a = new Audio(SRC[t]);
    a.loop = true;
    a.volume = 1; // temporarily 1 to test, lower it again later
    a.addEventListener("play", notify);
    a.addEventListener("pause", notify);
    a.addEventListener("error", () => console.error("Audio failed to load:", SRC[t], a?.error));
    audios[t] = a;
  }
  return a;
}

// plays one track from 0:00 and stops/rewinds the other
export function playTrack(t: Track) {
  if (typeof window === "undefined") return;
  (Object.keys(audios) as Track[]).forEach((k) => {
    if (k !== t) {
      audios[k]!.pause();
      audios[k]!.currentTime = 0;
    }
  });
  const a = get(t);
  a.currentTime = 0;
  current = t;
  a.play().then(notify).catch((e) => { console.error("Audio play blocked:", e); notify(); });
}

// only starts the track if it isn't already the current one
export function ensureTrack(t: Track) {
  if (current !== t) playTrack(t);
}

export const startMusic = () => playTrack("birthday");
export const startChristeningMusic = () => playTrack("christening");

export function stopMusic() {
  (Object.keys(audios) as Track[]).forEach((k) => {
    audios[k]!.pause();
    audios[k]!.currentTime = 0;
  });
  current = null;
  notify();
}

export function toggleMusic() {
  if (!current) return;
  const a = audios[current];
  if (!a) return;
  if (a.paused) a.play().catch(() => {});
  else a.pause();
}

export function musicState(): "off" | "on" | "paused" {
  if (!current) return "off";
  return audios[current]?.paused ? "paused" : "on";
}

export function subscribeMusic(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}