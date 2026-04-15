"use client";

import EditAlbum from "@/components/music/EditAlbum";
import { AlbumProvider, useAlbums } from "@/components/music/album-context";
import { useParams, useRouter } from "next/navigation";

function EditAlbumContent() {
  const params = useParams();
  const raw = params.id;
  const id = typeof raw === "string" ? Number(raw) : NaN;
  const { getAlbumById, loadAlbums, isLoading } = useAlbums();
  const router = useRouter();
  const album = Number.isNaN(id) ? null : getAlbumById(id);

  if (isLoading) {
    return (
      <div className="container p-4">
        <p>Loading…</p>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="container p-4">
        <p>Album not found.</p>
      </div>
    );
  }

  return (
    <EditAlbum
      album={album}
      onEditAlbum={async () => {
        await loadAlbums();
        router.push("/");
      }}
    />
  );
}

export default function EditAlbumPage() {
  return (
    <AlbumProvider>
      <EditAlbumContent />
    </AlbumProvider>
  );
}
