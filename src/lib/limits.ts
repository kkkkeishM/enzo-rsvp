// Keep these in sync with supabase/rsvp-guest-limits.sql (the database enforces them).
export const MAX_ATTENDANCE = 80;
export const MAX_NAME_LENGTH = 80;

// Used when someone opens the site without a personal invite link.
export const DEFAULT_LIMITS = { maxGuests: 5, maxAdults: 1, maxKids: 3 };

export type InviteInfo = {
  label: string | null;
  type: "friend" | "family";
  maxGuests: number;
  maxAdults: number;
  maxKids: number;
  full: boolean;
};