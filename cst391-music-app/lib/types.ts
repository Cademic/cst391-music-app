export interface Track {
  id?: number;
  number: number;
  title: string;
  lyrics?: string | null;
  video?: string | null;
}

export interface Album {
  id?: number;
  title: string;
  artist: string;
  year: number;
  image?: string | null;
  description?: string | null;
  tracks?: Track[];
}

/** Playlist row as returned by playlist APIs (camelCase JSON). */
export interface PlaylistSummary {
  id: string;
  name: string;
  ownerUserId: string | null;
  createdAt: string;
  trackCount: number;
}
