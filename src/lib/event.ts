export const EVENT = {
    title: "Enzo's 1st Birthday",
    subtitle: "Let's celebrate!",
    tagline: "Join us for a fun-filled day as we celebrate Enzo's very first birthday!",
    dateLabel: "Saturday, Nov. 21, 2026",
    schedule: [
      { label: "Venue:", time: "Jollibee San Joaquin" },
      { label: "Party Starts:", time: "1:00 PM" },
      { label: "Celebration Ends:", time: "3:00 PM" },
    ],
    venue: "[Venue name]",
    address: "[Street address, City]",
    dressCode: "Racing suits encouraged. Red is the team color.",
    notes: "Free parking at the venue. Snacks and cake provided. No gifts needed, just come and celebrate.",
  };
  
  export const mapsLink = (address: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;