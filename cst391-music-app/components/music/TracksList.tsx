"use client";

import type { Track } from "@/lib/types";
import TrackTitle from "./TrackTitle";

interface TracksListProps {
  tracks: Track[] | undefined;
  selectedTrackId: number | null;
  onSelectTrack: (track: Track) => void;
}

export default function TracksList({
  tracks,
  selectedTrackId,
  onSelectTrack,
}: TracksListProps) {
  const safeTracks = Array.isArray(tracks) ? tracks : [];

  if (safeTracks.length === 0) {
    return (
      <div className="list-group">
        <div className="list-group-item">No tracks available.</div>
      </div>
    );
  }

  const rendered = safeTracks.map((track) => (
    <TrackTitle
      key={
        track.id ??
        `${track.title ?? "t"}-${track.number ?? ""}`
      }
      track={track}
      isSelected={track.id === selectedTrackId}
      onSelect={onSelectTrack}
    />
  ));

  return <div className="list-group">{rendered}</div>;
}
