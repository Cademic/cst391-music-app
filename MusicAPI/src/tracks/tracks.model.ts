export interface Track {
    id: number;
    album_id: number;
    title: string;
    number: number;
    video_url: string | null;
    lyrics: string | null;
}
