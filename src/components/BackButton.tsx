"use client";

export default function BackButton({
  onClick,
  label = "Back",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button className="back-btn" type="button" onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.5 5.5 L8 12 L14.5 18.5" />
      </svg>
      <span>{label}</span>
    </button>
  );
}