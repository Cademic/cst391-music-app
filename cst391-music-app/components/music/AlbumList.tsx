"use client";

import type { Album } from "@/lib/types";
import { useRouter } from "next/navigation";
import Card from "./Card";

interface AlbumListProps {
  albumList: Album[];
  /**
   * When provided (home page from `page.tsx`), used instead of internal router —
   * matches the original pattern: parent passes navigate/updateSingleAlbum.
   */
  onNavigate?: (id: number, uri: string) => void;
}

export default function AlbumList({ albumList, onNavigate }: AlbumListProps) {
  const router = useRouter();

  const handleSelectionOne = (id: number, uri: string) => {
    if (onNavigate) {
      onNavigate(id, uri);
      return;
    }
    router.push(`${uri}${id}`);
  };

  const albums = albumList.map((album) => (
    <Card
      key={album.id ?? album.title}
      id={album.id ?? 0}
      albumTitle={album.title}
      albumDescription={album.description}
      buttonText="View"
      imgURL={album.image}
      onClick={handleSelectionOne}
    />
  ));

  return <div className="album-list-container">{albums}</div>;
}
