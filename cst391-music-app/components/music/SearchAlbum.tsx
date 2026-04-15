"use client";

import type { Album } from "@/lib/types";
import AlbumList from "./AlbumList";
import SearchForm from "./SearchForm";

export interface SearchAlbumProps {
  updateSearchResults: (phrase: string) => void | Promise<void>;
  albumList: Album[];
  /** Replaces React Router navigate: parent uses useRouter().push (e.g. /show/…, /edit/…). */
  updateSingleAlbum: (albumId: number, uri: string) => void;
}

/**
 * Ported from CRA SearchAlbum: receives callbacks and list from the parent route
 * (see course “Quick Win” / App.js pattern), not from a global data context.
 */
export default function SearchAlbum({
  updateSearchResults,
  albumList,
  updateSingleAlbum,
}: SearchAlbumProps) {
  return (
    <div className="container">
      <SearchForm onSubmit={updateSearchResults} />
      <AlbumList albumList={albumList} onNavigate={updateSingleAlbum} />
    </div>
  );
}
