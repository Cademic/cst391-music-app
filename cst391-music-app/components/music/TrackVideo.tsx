"use client";

import type { Track } from "@/lib/types";
import { useMemo } from "react";

function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (
      parsed.hostname.includes("youtube.com") &&
      parsed.pathname.startsWith("/embed/")
    ) {
      return url;
    }

    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.replace("/", "").trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

function buildYouTubeSearchUrl(artist: string | undefined, title: string) {
  const query = [artist, title].filter(Boolean).join(" ");
  const encoded = encodeURIComponent(query);
  return `https://www.youtube.com/results?search_query=${encoded}`;
}

interface TrackVideoProps {
  track: Track | null;
  albumArtist: string;
}

export default function TrackVideo({ track, albumArtist }: TrackVideoProps) {
  const embedUrl = useMemo(
    () => getYouTubeEmbedUrl(track?.video),
    [track?.video]
  );

  if (!track) {
    return (
      <p className="card-text mb-0">
        Show the YouTube video of the selected track here.
      </p>
    );
  }

  if (embedUrl) {
    return (
      <div>
        <h5 className="card-title mb-2">{track.title}</h5>
        <div className="ratio ratio-16x9">
          <iframe
            src={embedUrl}
            title={`${track.title} video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  const searchUrl = buildYouTubeSearchUrl(albumArtist, track.title);

  return (
    <div>
      <h5 className="card-title mb-2">{track.title}</h5>
      <p className="card-text mb-2">
        No video link is available for this track.
      </p>
      <a href={searchUrl} target="_blank" rel="noreferrer">
        Search on YouTube
      </a>
    </div>
  );
}
