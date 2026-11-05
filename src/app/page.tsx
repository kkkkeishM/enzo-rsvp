"use client";
import { useState } from "react";
import Wipe from "@/components/Wipe";
import SmokeWipe from "@/components/SmokeWipe";
import GodparentName, { type Godparent } from "@/components/GodparentName";
import Christening from "@/components/Christening";
import Envelope from "@/components/Envelope";
import Cover from "@/components/Cover";
import Invitation from "@/components/Invitation";
import BackButton from "@/components/BackButton";
import MusicButton from "@/components/MusicButton";
import { startChristeningMusic, startMusic } from "@/lib/music";



type Screen = "godparent" | "christening" | "envelope" | "cover" | "invite";
type WipePhase = "idle" | "in" | "out";
type Variant = "check" | "soft" | "smoke" | "smokeback";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("godparent");
  const [wipe, setWipe] = useState<WipePhase>("idle");
  const [variant, setVariant] = useState<Variant>("check");
  const [godparent, setGodparent] = useState<Godparent | null>(null);
  const [rsvped, setRsvped] = useState(false);
  const [wished, setWished] = useState(false);
  const [seenEnvelope, setSeenEnvelope] = useState(false);     // has the guest opened the envelope yet?
  const [skippedEnvelope, setSkippedEnvelope] = useState(false); // did this trip to the cover skip it?

  function goTo(next: Screen, v: Variant = "check") {
    if (wipe !== "idle") return; // ignore taps while a transition is running
    setVariant(v);
    const t =
      v === "smoke" ? { swap: 1700, end: 3700 } :
      v === "smokeback" ? { swap: 1500, end: 3500 } :
      { swap: 650, end: 1300 };

    // wait two frames so the wipe is painted off-screen before it slides in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setWipe("in");
        setTimeout(() => {
          setScreen(next);
          setWipe("out");
        }, t.swap);
        setTimeout(() => setWipe("idle"), t.end);
      });
    });
  }

  const isSmoke = variant === "smoke" || variant === "smokeback";

  

  return (
    <>
      {isSmoke ? (
        <SmokeWipe phase={wipe} withCar={variant !== "smokeback"} />
      ) : (
        <div className={variant === "soft" ? "wipe-soft" : undefined}>
          <Wipe phase={wipe} />
        </div>
      )}

      <MusicButton />

      {screen === "godparent" && (
        <GodparentName
          onDone={(g) => {
            startChristeningMusic();   // inside the tap, so phones allow audio
            setGodparent(g);
            goTo("christening", "soft");
          }}
        />
      )}

      {screen === "christening" && (
        <Christening
          godparent={godparent}
          onContinue={() => {
            if (seenEnvelope) {
              startMusic(); 
              setSkippedEnvelope(true);   // returning guest: skip the envelope
              goTo("cover", "smoke");
            } else {
              setSkippedEnvelope(false);  // first visit: show the envelope
              goTo("envelope", "smoke");
            }
          }}
        />
      )}

      {screen === "envelope" && (
        <>
          <Envelope
            onOpened={() => {
              setSeenEnvelope(true);
              goTo("cover");
            }}
          />
          <BackButton
              onClick={() => {
                startChristeningMusic();
                goTo("christening", "smokeback");
              }}
              label="Back"
            />
        </>
      )}

      {screen === "cover" && (
        <Cover
          onEnter={() => goTo("invite")}
          onBack={() => {
            if (skippedEnvelope) {
              startChristeningMusic();
              goTo("christening", "smokeback");
            } else {
              goTo("envelope");   // birthday song keeps playing, as before
            }
          }}
        />
      )}

      {screen === "invite" && (
        <Invitation
          startAtDetails={skippedEnvelope}
          onBack={() => goTo("cover")}
          godparent={godparent}
          alreadyRsvped={rsvped}
          alreadyWished={wished}
          onRsvped={() => setRsvped(true)}
          onWished={() => setWished(true)}
          onChristening={() => {
            startChristeningMusic();   // stops and rewinds the birthday song, restarts the christening song
            goTo("christening", "smokeback");
          }}
        />
      )}
    </>
  );
}