import type { Track } from '../tracks/tracks.model';

export interface Album {
    id: number;
    title: string;
    artist: string;
    description: string | null;
    year: number;
    image: string | null;
    tracks: Track[];
}
