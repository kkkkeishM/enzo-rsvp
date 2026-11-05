let whoosh: HTMLAudioElement | null = null;

export function preloadWhoosh() {
  if (typeof window === "undefined" || whoosh) return;
  whoosh = new Audio("/whoosh.mp3");
  whoosh.preload = "auto";
  whoosh.volume = 0.8;
}

export function playWhoosh() {
  preloadWhoosh();
  if (!whoosh) return;
  whoosh.currentTime = 0;
  whoosh.play().catch(() => {});
}

export function stopWhoosh() {
  whoosh?.pause();
}