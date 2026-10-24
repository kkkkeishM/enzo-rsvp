"use client";

export default function Envelope({ onOpened }: { onOpened: () => void }) {
    return <div onClick={onOpened}>Envelope</div>;
}