

  // Photos for the polaroid wall (the first 20 are shown, in this order).
// 1) Put the image files in  public/wall/   (about 500px wide, under ~120 KB each)
// 2) List them below. Each item is either just the path, or a path with a caption:
//      "/wall/enzo-1.jpg",
//      { src: "/wall/enzo-2.jpg", caption: "Race day" },
export type WallPhoto = string | { src: string; caption?: string };

export const WALL_PHOTOS: WallPhoto[] = [
  "/wall/enzo-1.jpg",
  { src: "/wall/enzo-2.jpg", caption: "Race day" },
  "/wall/enzo-3.jpg",
  { src: "/wall/enzo-4.jpg", caption: "Fast as lightning" },
  "/wall/enzo-5.jpg",
  { src: "/wall/enzo-6.jpg", caption: "VROOM" },
  "/wall/enzo-7.jpg",
  { src: "/wall/enzo-8.jpg", caption: "Luan!" },
  "/wall/enzo-9.jpg",
  { src: "/wall/enzo-10.jpg", caption: "Speed" },
  "/wall/enzo-11.jpg",
  { src: "/wall/enzo-12.jpg", caption: "Ka-chow!" },
  "/wall/enzo-13.jpg",
  { src: "/wall/enzo-14.jpg", caption: "Wittywiww" },
  "/wall/enzo-15.jpg",
  { src: "/wall/enzo-16.jpg", caption: "Race day" },
  "/wall/enzo-17.jpg",
  { src: "/wall/enzo-18.jpg", caption: "VROOM" },
  "/wall/enzo-19.jpg",
  { src: "/wall/enzo-20.jpg", caption: "Zoom zoom" },
];

// Captions printed under the empty frames until you add more photos.
export const BLANK_CAPTIONS = ["Fast as lightning", "Zoom zoom", "Race day", "Vroom!", "Speed", "Ka-chow!", "Wittywiww", "Race race"];