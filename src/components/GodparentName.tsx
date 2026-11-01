"use client";
import { useState } from "react";
import { MAX_NAME_LENGTH } from "@/lib/limits";
import { findGodparentTitle, type GodparentTitle } from "@/lib/christening";

export type Godparent = { title: GodparentTitle | null; name: string };

// "maria santos" -> "Maria Santos" (only when the guest typed it all lowercase)
const tidy = (s: string) =>
  s === s.toLowerCase() ? s.replace(/(^|\s)(\S)/g, (_, a, b) => a + b.toUpperCase()) : s;

export default function GodparentName({ onDone }: { onDone: (g: Godparent) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [askTitle, setAskTitle] = useState(false); // second step, only for names that aren't in the list

  const clean = name.trim().replace(/\s+/g, " ");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clean) return setError("Please type your name.");
    setError("");
    const title = findGodparentTitle(clean);
    if (title) return onDone({ title, name: tidy(clean) });
    setAskTitle(true);
  }

  return (
    <main className="gx-screen">
      <form className="gx-card" onSubmit={submit} noValidate>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="gx-star g" src="/christening/star-gold.png" width={160} height={168} alt="" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="gx-star b" src="/christening/star-blue.png" width={160} height={150} alt="" aria-hidden="true" />

        {!askTitle ? (
          <>
            <h1 className="gx-title">Tell us your name</h1>
            <input
              className="gx-input"
              type="text"
              aria-label="Your name"
              autoComplete="name"
              placeholder="Enter your name"
              maxLength={MAX_NAME_LENGTH}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="gx-err" role="alert">{error}</p>
            <button type="submit" className="gx-go">Continue ♡</button>
          </>
        ) : (
          <>
            <h1 className="gx-title">How should we call you?</h1>
            <div className="gx-choice">
              <button type="button" className="gx-go" onClick={() => onDone({ title: "Ninong", name: tidy(clean) })}>Ninong</button>
              <button type="button" className="gx-go" onClick={() => onDone({ title: "Ninang", name: tidy(clean) })}>Ninang</button>
            </div>
            <button type="button" className="gx-back" onClick={() => setAskTitle(false)}>Change my name</button>
          </>
        )}
      </form>
    </main>
  );
}