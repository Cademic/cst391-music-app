import { execute } from '../services/mysql.connector';
import { Track } from './tracks.model';
import { trackQueries } from './tracks.queries';

export const readTracks = async (albumId: number) => {
    return execute<Track[]>(trackQueries.readTracks, [albumId]);
};

export const readAllTracks = async () => {
    return execute<Track[]>(trackQueries.readAllTracks, []);
};

export const createTrackForAlbum = async (track: Track) => {
    return execute<Track[]>(trackQueries.createTrack,
        [track.album_id, track.title, track.number, track.video_url, track.lyrics]);
};

export const createTrack = async (track: Track, index: number, albumId: number) => {
    return execute<Track[]>(trackQueries.createTrack,
        [albumId, track.title, track.number, track.video_url, track.lyrics]);
};

export const updateTrack = async (track: Track) => {
    return execute<Track[]>(trackQueries.updateTrack,
        [track.title, track.number, track.video_url, track.lyrics, track.id]);
};

export const deleteTrack = async (trackId: number) => {
    return execute<Track[]>(trackQueries.deleteTrack, [trackId]);
};
