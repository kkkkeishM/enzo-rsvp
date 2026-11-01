// Everything on the christening page lives here.

export type GodparentTitle = "Ninong" | "Ninang";

// Fill this in with your guests. "Ninong" is for boys, "Ninang" is for girls.
// names = every way the guest might type their name (full name, first name, nickname).
export const GODPARENTS: { title: GodparentTitle; names: string[] }[] = [
  { title: "Ninang", names: ["Maria Santos", "Maria"] },
  { title: "Ninong", names: ["Jose Reyes", "Jose", "Joey"] },
];

// lowercase, no accents, no punctuation, single spaces, so "José  Reyes." matches "jose reyes"
const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

export function findGodparentTitle(name: string): GodparentTitle | null {
  const n = norm(name);
  if (!n) return null;
  const hit = GODPARENTS.find((g) => g.names.some((x) => norm(x) === n));
  return hit ? hit.title : null;
}

// "Dear Ninang Maria," or "Dear Ninong Jose,". A name that isn't in the list gets "Dear Ninong/Ninang Name,".
export const greetingFor = (g?: { title: GodparentTitle | null; name: string } | null) =>
  g ? `Dear ${g.title ?? "Ninong/Ninang"} ${g.name},` : LETTER.greeting;

  
  export const CHRISTENING = {
    image: "/christening/invitation.webp",
    imageAlt: "Baptism invitation: Please join us for the baptism of our son, Enzo Luan, on November 21, 2026.",
    mapsQuery: "Immaculate Conception Cathedral, Plaza Rizal, Justice Ramon Jabson, Pasig City",
    directionsLabel: "Google Maps",
    wazeLabel: "Waze",
    continueLabel: "Continue to the birthday celebration",
  };
  
  export const directionsLinkFor = (query: string) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}&travelmode=driving`;
  
  export const wazeLinkFor = (query: string) =>
    `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`;

    export const LETTER = {
      greeting: "Dear Ninong/Ninang,",
      paragraphs: [
        "It’s me, Enzo! I have a very special day coming up, and I would be so happy to have you be part of it!",
        "I’m getting ready for my baptism, and having you by my side would make the day even more meaningful.",
        "As I grow, I hope you’ll guide me, keep me in your prayers, teach me good things, and shower me with lots of love.",
        "Will you join me and my family on this very special day? I can’t wait to see you!",
      ],
      closing: "With lots of love,",
      signature: "Enzo Luan ♡",
    };

    export const DETAILS = {
      date: "Saturday, November 21, 2026",
      time: "8:00 AM – 11:00 AM",
      venue: "Immaculate Conception Cathedral",
      address: "Plaza Rizal, Justice Ramon Jabson, Pasig City",
    };

   