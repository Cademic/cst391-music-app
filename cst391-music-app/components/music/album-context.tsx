"use client";

import type { Album } from "@/lib/types";
import fallbackAlbums from "@/lib/albums-fallback.json";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchAlbums } from "./music-api";

interface AlbumContextValue {
  albumList: Album[];
  searchPhrase: string;
  updateSearchResults: (phrase: string) => void;
  renderedList: Album[];
  loadAlbums: () => Promise<void>;
  getAlbumById: (id: number) => Album | null;
  isLoading: boolean;
}

const AlbumContext = createContext<AlbumContextValue | null>(null);

export function AlbumProvider({ children }: { children: React.ReactNode }) {
  const [searchPhrase, setSearchPhrase] = useState("");
  const [albumList, setAlbumList] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlbums = useCallback(async () => {
    try {
      const data = await fetchAlbums();
      setAlbumList(data);
    } catch (e) {
      console.error(
        "Failed to load albums from REST service, using local data:",
        e instanceof Error ? e.message : e
      );
      setAlbumList(fallbackAlbums as unknown as Album[]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlbums();
  }, [loadAlbums]);

  const updateSearchResults = useCallback((phrase: string) => {
    setSearchPhrase(phrase);
  }, []);

  const renderedList = useMemo(
    () =>
      albumList.filter((album) => {
        if (
          (album.description &&
            album.description
              .toLowerCase()
              .includes(searchPhrase.toLowerCase())) ||
          searchPhrase === ""
        ) {
          return true;
        }
        return false;
      }),
    [albumList, searchPhrase]
  );

  const getAlbumById = useCallback(
    (id: number) => albumList.find((a) => a.id === id) ?? null,
    [albumList]
  );

  const value = useMemo(
    () => ({
      albumList,
      searchPhrase,
      updateSearchResults,
      renderedList,
      loadAlbums,
      getAlbumById,
      isLoading,
    }),
    [
      albumList,
      searchPhrase,
      updateSearchResults,
      renderedList,
      loadAlbums,
      getAlbumById,
      isLoading,
    ]
  );

  return (
    <AlbumContext.Provider value={value}>{children}</AlbumContext.Provider>
  );
}

export function useAlbums() {
  const ctx = useContext(AlbumContext);
  if (!ctx) {
    throw new Error("useAlbums must be used within AlbumProvider");
  }
  return ctx;
}
