"use client";

export default function Cover({ onEnter }: { onEnter: () => void }) {
    return <div onClick={onEnter}>Cover</div>;
}