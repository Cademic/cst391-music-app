"use client";

import type { Track } from "@/lib/types";

interface TrackTitleProps {
  track: Track;
  isSelected: boolean;
  onSelect: (track: Track) => void;
}

export default function TrackTitle({
  track,
  isSelected,
  onSelect,
}: TrackTitleProps) {
  const handleClick = () => {
    onSelect(track);
  };

  return (
    <button
      type="button"
      className={`list-group-item list-group-item-action ${isSelected ? "active" : ""}`}
      onClick={handleClick}
    >
      {track.number != null ? `${track.number}. ` : ""}
      {track.title ?? "Untitled track"}
    </button>
  );
}
