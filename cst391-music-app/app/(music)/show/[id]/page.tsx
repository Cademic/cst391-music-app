"use client";

import OneAlbum from "@/components/music/OneAlbum";
import { AlbumProvider, useAlbums } from "@/components/music/album-context";
import { useParams } from "next/navigation";

function ShowAlbumContent() {
  const params = useParams();
  const raw = params.id;
  const id = typeof raw === "string" ? Number(raw) : NaN;
  const { getAlbumById, isLoading } = useAlbums();
  const album = Number.isNaN(id) ? null : getAlbumById(id);

  if (isLoading) {
    return (
      <div className="container p-4">
        <p>Loading…</p>
      </div>
    );
  }

  return <OneAlbum key={Number.isNaN(id) ? "invalid" : id} album={album} />;
}

export default function ShowAlbumPage() {
  return (
    <AlbumProvider>
      <ShowAlbumContent />
    </AlbumProvider>
  );
}
