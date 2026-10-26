export const EVENT = {
    title: "Enzo's 1st Birthday",
    subtitle: "Let's celebrate 🎉",
    tagline: "Join us for a fun-filled day as we celebrate Enzo's very first birthday!",
    dateLabel: "Saturday, Nov. 21, 2026",
    schedule: [
      { label: "Venue:", time: "Jollibee San Joaquin" },
      { label: "Party Starts:", time: "1:00 PM" },
      { label: "Celebration Ends:", time: "3:00 PM" },
    ],
    venue: "Jollibee San Joaquin",
    address: "M. Concepcion Ave. cor. Justice Ramon Jabson St., San Joaquin, Pasig City",
    dressColors: [
      { name: "Red", hex: "#e63b2e" },
      { name: "Black", hex: "#15161c" },
      { name: "White", hex: "#ffffff" },
      { name: "Brown", hex: "#7a4a2a" },
    ],
    dressNote: "Please wear comfortable attire in these colors for a relaxed celebration.",
    parking: "Free parking is available at the venue.",
    arrival: "Please arrive strictly 30 minutes before the party start.",
    notes: "Free parking at the venue. Snacks and cake provided. No gifts needed, just come and celebrate.",
  };
  
  export const mapsLink = (address: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;