// Everything on the christening page lives here.
export const CHRISTENING = {
    image: "/christening/invitation.webp", // your invitation picture, in public/christening/
    imageAlt: "Baptism invitation: Please join us for the baptism of our son, Enzo Luan, on November 21, 2026.",
    mapsQuery: "Makati Cathedral, Makati, Metro Manila", // used for the directions button
    directionsLabel: "Get directions to the Church",
    continueLabel: "Continue to the birthday celebration",
  };
  
  export const mapsLinkFor = (query: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      "Immaculate Conception Cathedral, Plaza Rizal, Justice Ramon Jabson, Pasig, 1600 Metro Manila"
    )}`;


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