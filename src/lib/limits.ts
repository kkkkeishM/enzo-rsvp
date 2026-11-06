// Keep these in sync with supabase/rsvp-guest-limits.sql (the database enforces them).
export const MAX_ATTENDANCE = 80;
export const MAX_NAME_LENGTH = 80;

// Kids: never more than MAX_KIDS per RSVP, each aged MIN_CHILD_AGE to MAX_CHILD_AGE.
export const MAX_KIDS = 2;
export const MIN_CHILD_AGE = 3;
export const MAX_CHILD_AGE = 17;

// Used when someone opens the site without a personal invite link.
export const DEFAULT_LIMITS = { maxGuests: 5, maxAdults: 1, maxKids: MAX_KIDS };

export type InviteInfo = {
  label: string | null;
  type: "friend" | "family";
  maxGuests: number;
  maxAdults: number;
  maxKids: number;
  full: boolean;
};