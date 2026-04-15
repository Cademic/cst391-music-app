"use client";

// CHANGED: Next.js uses TypeScript and server/client separation.
// This component uses hooks and interactivity, so we must mark it as a Client Component.
//
// Follows the course ItemList pattern: fetch("/api/...") + explicit Album[] typing,
// not axios and not a hardcoded API host (Vercel-safe relative paths).

import type { Album } from "@/lib/types";
import fallbackAlbums from "@/lib/albums-fallback.json";
import SearchAlbum from "@/components/music/SearchAlbum";
import { parseAlbumsJson } from "@/components/music/music-api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// import EditAlbum from "@/components/music/EditAlbum";
// import OneAlbum from "@/components/music/OneAlbum";
// NavBar: rendered in app/(music)/layout.tsx (replaces inline <NavBar /> from CRA App.js)

/** For assignment screenshots — shown on the home screen. */
const STUDENT_NAME = "Carter Wright";

// CHANGED: In Next.js, CRA "App" is replaced by a route-level component: page.tsx
export default function Page() {
  const [searchPhrase, setSearchPhrase] = useState("");
  const [albumList, setAlbumList] = useState<Album[]>([]);
  const [, setCurrentlySelectedAlbumId] = useState(0);
  const [loadNote, setLoadNote] = useState<string | null>(null);

  const router = useRouter();

  // ItemList-style fetch + guard: 500 responses return { error } — not an array (avoid .filter crash)
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/albums");
        const json: unknown = await res.json();
        const parsed = parseAlbumsJson(json);

        if (res.ok && parsed) {
          console.log("Fetched albums:", parsed);
          setAlbumList(parsed);
          setLoadNote(null);
          return;
        }

        console.warn(
          "GET /api/albums not usable (status or non-array body). Using bundled fallback.",
          res.status,
          json
        );
        setAlbumList(fallbackAlbums as unknown as Album[]);
        setLoadNote(
          res.ok
            ? "API returned non-array JSON; showing bundled sample albums."
            : `API error (${res.status}). Showing bundled sample albums — set POSTGRES_URL / DATABASE_URL on Vercel for live data.`
        );
      } catch (e) {
        console.error(e);
        setAlbumList(fallbackAlbums as unknown as Album[]);
        setLoadNote(
          "Network or parse error. Showing bundled sample albums — set POSTGRES_URL / DATABASE_URL on Vercel for live data."
        );
      }
    })();
  }, []);

  const updateSearchResults = async (phrase: string) => {
    console.log("phrase is " + phrase);
    setSearchPhrase(phrase);
  };

  // CHANGED: replace navigate() with router.push()
  // Dynamic routes are app/(music)/show/[id] and edit/[id] — URL segment is album id, not array index.
  const updateSingleAlbum = (albumId: number, uri: string) => {
    console.log("Update Single Album = ", albumId);
    const indexNumber = albumList.findIndex((a) => a.id === albumId);
    setCurrentlySelectedAlbumId(indexNumber);
    const path = `${uri}${albumId}`;
    console.log("path", path);
    router.push(path);
  };

  const renderedList = albumList.filter((album) => {
    if (
      (album.description ?? "")
        .toLowerCase()
        .includes(searchPhrase.toLowerCase()) ||
      searchPhrase === ""
    ) {
      return true;
    }
    return false;
  });

  return (
    <main className="container py-4">
      <h1 className="mb-2">Sparks Album List</h1>
      <p className="mb-3">
        <strong>Student:</strong> {STUDENT_NAME}
      </p>

      {loadNote ? (
        <div className="alert alert-warning small" role="status">
          {loadNote}
        </div>
      ) : null}

      {/* Ported SearchAlbum: props from parent (course handout), not axios / not react-router */}
      <SearchAlbum
        updateSearchResults={updateSearchResults}
        albumList={renderedList}
        updateSingleAlbum={(albumId: number) =>
          updateSingleAlbum(albumId, "/show/")
        }
      />

      <hr className="my-4" />

      {/* Quick Win: optional debug block — raw JSON from the same /api/albums response */}
      <h2 className="h5">Debug: API JSON (Quick Win)</h2>
      <p className="small text-muted">
        This JSON data is rendered directly from the API response.
      </p>
      <pre
        style={{
          backgroundColor: "#f4f4f4",
          padding: "1rem",
          borderRadius: "8px",
          overflow: "auto",
          color: "#111",
          fontSize: "0.9rem",
          lineHeight: "1.4",
        }}
      >
        {albumList.length > 0 && JSON.stringify(albumList, null, 2)}
      </pre>
      {albumList.length === 0 && !loadNote && <p>Loading albums...</p>}
    </main>
  );
}
