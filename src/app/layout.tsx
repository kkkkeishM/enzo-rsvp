import type { Metadata } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import "./globals.css";
import { Kaushan_Script } from "next/font/google";

const script = Kaushan_Script({ weight: "400", subsets: ["latin"], variable: "--font-script" });
// then add ${script.variable} to the className on <html>

const display = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
});


export const metadata: Metadata = {
  metadataBase: new URL("https://enzo-rsvp.vercel.app/"), // your real live URL
  title: "Route 001 | Enzo's Road to ONE",
  description: "A year of love and little adventures, and a special day to celebrate Enzo's first birthday and christening. Tap to see the details and RSVP.",
  openGraph: {
    title: "Route 001 | Enzo's Road to ONE",
    description: "A year of love and little adventures, and a special day to celebrate Enzo's first birthday and christening. Tap to see the details and RSVP.",
    url: "/",
    siteName: "Route 001 | Enzo's Road to ONE",
    type: "website",
    images: [
      {
        url: "public/poster.png",
        width: 1200,
        height: 630,
        alt: "Enzo First Birthday and Christening to Remember!",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}

