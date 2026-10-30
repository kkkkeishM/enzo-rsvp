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