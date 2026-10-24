"use client";
import Cover from "@/components/Cover";
import Envelope from "@/components/Envelope";
import Invitation from "@/components/Invitation";
import Wipe from "@/components/Wipe";
import {useState} from "react";

type Screen = 'envelope' | 'cover' | 'invite';
type WipePhase = "idle" | "in" | "out";

export default function Home() {
  const [screen, setScreen] = useState<Screen>('envelope');
  const [wipe, setWipe] = useState<WipePhase>("idle");

  function goTo(next: Screen) {
    if (wipe !== "idle") return;
    setWipe("in");
    setTimeout(() => { setScreen(next); setWipe("out");}, 650)
    setTimeout(() => { setWipe("idle"); }, 1300);
  }

  return (
    <>
      <Wipe phase={wipe} />
      {screen === 'envelope' && <Envelope onOpened={() => goTo('cover')} />}
      {screen === 'cover' && <Cover onEnter={() => goTo('invite')} />}
      {screen === 'invite' && <Invitation onBack={() => goTo('cover')} />}
    </>
  );
}