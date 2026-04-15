"use client";

import EditAlbum from "@/components/music/EditAlbum";
import { AlbumProvider, useAlbums } from "@/components/music/album-context";
import { useRouter } from "next/navigation";

function NewAlbumContent() {
  const { loadAlbums } = useAlbums();
  const router = useRouter();

  return (
    <EditAlbum
      onEditAlbum={async () => {
        await loadAlbums();
        router.push("/");
      }}
    />
  );
}

export default function NewAlbumPage() {
  return (
    <AlbumProvider>
      <NewAlbumContent />
    </AlbumProvider>
  );
}
