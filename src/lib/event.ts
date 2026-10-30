export const EVENT = {
    title: "Enzo Luan 's 1st Birthday",
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
      { name: "Blue", hex: "#0000FF" },
      { name: "Black", hex: "#15161c" },
      { name: "White", hex: "#ffffff" },
      { name: "Brown", hex: "#7a4a2a" },
    ],
    dressNote: "Please wear comfortable attire in these colors for a relaxed celebration.",
    parking: "Free parking is available at the venue.",
    arrival: "Please arrive strictly 30 minutes before the party start.",
    notes: "Free parking at the venue. Snacks and cake provided. No gifts needed, just come and celebrate.",
  };
  
  // Google Maps: opens turn-by-turn directions from the guest's current location, with the route highlighted
  export const googleDirections = (address: string) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;

  // Waze: opens the Waze app (or the Waze website if the app isn't installed) and starts navigation
  export const wazeDirections = (address: string) =>
    `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;


  export const GIFTS = {
    title: "A Little Gift Guide for Enzo",
    intro:
      "Your presence is already a wonderful gift! But if you’re thinking of bringing something for Enzo, here are a few ideas that might be helpful. Anything chosen with love will surely be appreciated. ❤️",
    ideas: [
      {
        emoji: "👕",
        title: "Clothes (1–2 years old)",
        text: "If you’d like to gift clothes, comfy and adorable outfits that Enzo can wear as he grows would be lovely.",
      },
      {
        emoji: "🧷",
        title: "Hanmac & Kleenfant Diapers — Size XL",
        text: "For those who prefer practical gifts, diapers are always helpful in keeping Enzo comfy, dry, and happy.",
      },
      {
        emoji: "🍼",
        title: "Milk",
        text: "If you’d like to give milk to keep his little tummy happy, Enzo uses Nestogen. Your thoughtful gift will be appreciated!.",
      },
      {
        emoji: "🧸",
        title: "Building Blocks, Toys & Learning Books (1–2 Years Old)",
         text: "Colorful building blocks, fun toys, and picture books to support Enzo’s creativity, curiosity, and motor skills as he learns through play.",
      },
      {
        emoji: "💰",
        title: "A Little Something for His Future",
        text: "If you prefer giving monetary gifts, any amount is appreciated and can go toward Enzo’s growing needs. There’s absolutely no required amount.",
      },
    ],
    outro:
      "Most of all, we’re happy to celebrate this special milestone with you. Thank you for being part of Enzo’s little world! 🏁❤️",
  };