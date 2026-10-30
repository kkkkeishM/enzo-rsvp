"use client";
import { useState } from "react";
import Wipe from "@/components/Wipe";
import Christening from "@/components/Christening";
import Envelope from "@/components/Envelope";
import Cover from "@/components/Cover";
import Invitation from "@/components/Invitation";
import BackButton from "@/components/BackButton";

type Screen = "christening" | "envelope" | "cover" | "invite";
type WipePhase = "idle" | "in" | "out";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("christening");
  const [wipe, setWipe] = useState<WipePhase>("idle");

  function goTo(next: Screen) {
    if (wipe !== "idle") return; // ignore taps while a transition is running
    setWipe("in");
    setTimeout(() => {
      setScreen(next);
      setWipe("out");
    }, 650);
    setTimeout(() => setWipe("idle"), 1300);
  }

  return (
    <>
      <Wipe phase={wipe} />
      {screen === "christening" && <Christening onContinue={() => goTo("envelope")} />}
      {screen === "envelope" && (
        <>
          <Envelope onOpened={() => goTo("cover")} />
          <BackButton onClick={() => goTo("christening")} label="Back" />
        </>
      )}
      {screen === "cover" && <Cover onEnter={() => goTo("invite")} onBack={() => goTo("envelope")} />}
      {screen === "invite" && <Invitation onBack={() => goTo("cover")} />}
    </>
  );
}