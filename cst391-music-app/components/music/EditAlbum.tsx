"use client";

import type {
  Album,
  AlbumCreatePayload,
  AlbumUpdatePayload,
  Track,
  TrackMutationPayload,
} from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { postAlbum, putAlbum } from "./music-api";

interface EditAlbumProps {
  album?: Album;
  onEditAlbum?: () => void | Promise<void>;
}

export default function EditAlbum({ album: albumProp, onEditAlbum }: EditAlbumProps) {
  const newAlbumCreation = !albumProp;

  const [albumTitle, setAlbumTitle] = useState(albumProp?.title ?? "");
  const [artist, setArtist] = useState(albumProp?.artist ?? "");
  const [description, setDescription] = useState(albumProp?.description ?? "");
  const [year, setYear] = useState(
    albumProp?.year != null ? String(albumProp.year) : ""
  );
  const [image, setImage] = useState(albumProp?.image ?? "");
  const [tracks, setTracks] = useState<Track[]>(
    Array.isArray(albumProp?.tracks) ? albumProp.tracks : []
  );

  const [trackNumber, setTrackNumber] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [trackLyrics, setTrackLyrics] = useState("");
  const [trackVideo, setTrackVideo] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  function mapTracksForApi(trackList: Track[]): TrackMutationPayload[] {
    return trackList.map((t) => {
      const n = t.number;
      const num =
        n === undefined || n === null ? null : Number(n);
      return {
        id: t.id,
        number: num != null && !Number.isNaN(num) ? num : null,
        title: t.title,
        lyrics: t.lyrics ?? null,
        video: t.video ?? null,
      };
    });
  }

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const yearNum = year.trim() === "" ? NaN : Number(year);
    if (Number.isNaN(yearNum)) {
      alert("Please enter a valid year.");
      return;
    }

    void saveAlbumPayload(yearNum);
  };

  const saveAlbumPayload = async (yearNum: number) => {
    try {
      setIsSaving(true);
      if (newAlbumCreation) {
        const payload: AlbumCreatePayload = {
          title: albumTitle,
          artist,
          description,
          year: yearNum,
          image,
          tracks: mapTracksForApi(tracks),
        };
        await postAlbum(payload);
      } else {
        if (albumProp?.id == null) {
          alert("Cannot update: album has no id.");
          return;
        }
        const payload: AlbumUpdatePayload = {
          id: albumProp.id,
          title: albumTitle,
          artist,
          description,
          year: yearNum,
          image,
          tracks: mapTracksForApi(tracks),
        };
        await putAlbum(payload);
      }
      alert(
        newAlbumCreation
          ? "Album created successfully."
          : "Album updated successfully."
      );
      if (onEditAlbum) await onEditAlbum();
      else router.push("/");
    } catch (err) {
      console.error("Failed to save album:", err);
      alert(
        newAlbumCreation
          ? "Album creation failed. Make sure the API and database are available."
          : "Album update failed. Make sure the API and database are available."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/");
  };

  const addTrack = () => {
    const trimmedTitle = (trackTitle ?? "").trim();
    if (!trimmedTitle) return;

    const num =
      trackNumber === "" ? null : Number(trackNumber);
    const nextTrack: Track = {
      id: undefined,
      number: num != null && !Number.isNaN(num) ? num : 0,
      title: trimmedTitle,
      lyrics: trackLyrics || null,
      video: trackVideo || null,
    };

    setTracks((current) => [...current, nextTrack]);
    setTrackNumber("");
    setTrackTitle("");
    setTrackLyrics("");
    setTrackVideo("");
  };

  const removeTrack = (indexToRemove: number) => {
    setTracks((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const updateExistingTrack = (
    indexToUpdate: number,
    patch: Partial<Track>
  ) => {
    setTracks((current) =>
      current.map((t, index) => {
        if (index !== indexToUpdate) return t;
        return { ...t, ...patch };
      })
    );
  };

  return (
    <div className="container">
      <form onSubmit={handleFormSubmit}>
        <h1>{newAlbumCreation ? "Create New" : "Edit"} Album</h1>
        <div className="form-group">
          <label htmlFor="albumTitle">Album Title</label>
          <input
            type="text"
            className="form-control"
            id="albumTitle"
            placeholder="Enter Album Title"
            value={albumTitle}
            onChange={(e) => setAlbumTitle(e.target.value)}
          />
          <label htmlFor="albumArtist">Artist</label>
          <input
            type="text"
            className="form-control"
            id="albumArtist"
            placeholder="Enter Album Artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
          <label htmlFor="albumDescription">Description</label>
          <textarea
            className="form-control"
            id="albumDescription"
            placeholder="Enter Album Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <label htmlFor="albumYear">Year</label>
          <input
            type="text"
            className="form-control"
            id="albumYear"
            placeholder="Enter Album Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
          <label htmlFor="albumImage">Image</label>
          <input
            type="text"
            className="form-control"
            id="albumImage"
            placeholder="Enter Album Image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>

        <hr />

        <h4>Tracks</h4>
        <div className="form-group">
          <label htmlFor="trackNumber">Track Number</label>
          <input
            type="text"
            className="form-control"
            id="trackNumber"
            placeholder="Enter Track Number"
            value={trackNumber}
            onChange={(e) => setTrackNumber(e.target.value)}
          />

          <label htmlFor="trackTitle">Track Title</label>
          <input
            type="text"
            className="form-control"
            id="trackTitle"
            placeholder="Enter Track Title"
            value={trackTitle}
            onChange={(e) => setTrackTitle(e.target.value)}
          />

          <label htmlFor="trackLyrics">Lyrics</label>
          <textarea
            className="form-control"
            id="trackLyrics"
            placeholder="Enter Track Lyrics"
            value={trackLyrics}
            onChange={(e) => setTrackLyrics(e.target.value)}
          />

          <label htmlFor="trackVideo">YouTube URL</label>
          <input
            type="text"
            className="form-control"
            id="trackVideo"
            placeholder="Enter Track YouTube URL"
            value={trackVideo}
            onChange={(e) => setTrackVideo(e.target.value)}
          />

          <button
            type="button"
            className="btn btn-secondary mt-2"
            onClick={addTrack}
          >
            Add Track
          </button>
        </div>

        {tracks.length > 0 ? (
          <div className="mt-3">
            <h5>Tracks</h5>
            <div className="list-group">
              {tracks.map((t, index) => (
                <div
                  key={`${t.id ?? "new"}-${index}`}
                  className="list-group-item"
                >
                  <div className="row g-2 align-items-end">
                    <div className="col-12 col-md-2">
                      <label className="form-label mb-0">#</label>
                      <input
                        type="text"
                        className="form-control"
                        value={t.number ?? ""}
                        onChange={(e) =>
                          updateExistingTrack(index, {
                            number:
                              e.target.value === ""
                                ? 0
                                : Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label mb-0">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={t.title ?? ""}
                        onChange={(e) =>
                          updateExistingTrack(index, { title: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label mb-0">YouTube</label>
                      <input
                        type="text"
                        className="form-control"
                        value={t.video ?? ""}
                        onChange={(e) =>
                          updateExistingTrack(index, { video: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-12 col-md-2 d-flex justify-content-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeTrack(index)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="col-12">
                      <label className="form-label mb-0">Lyrics</label>
                      <textarea
                        className="form-control"
                        value={t.lyrics ?? ""}
                        onChange={(e) =>
                          updateExistingTrack(index, { lyrics: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            className="btn btn-light"
            onClick={handleCancel}
          >
            Cancel
          </button>{" "}
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
