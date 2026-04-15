"use client";

import NavBar from "@/components/music/NavBar";
import "@/components/music/music-app.css";

export default function MusicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
