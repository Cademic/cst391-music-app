import { OkPacket } from 'mysql';
import { execute } from '../services/mysql.connector';
import { Artist } from './artists.model';
import { artistQueries } from './artists.queries';

export const readArtists = async () => {
    return execute<Artist[]>(artistQueries.readArtists, []);
};

export const createArtist = async (artist: Artist) => {
    return execute<OkPacket>(artistQueries.createArtist, [artist.artist]);
};

export const updateArtist = async (artist: Artist) => {
    return execute<OkPacket>(artistQueries.updateArtist, [artist.artist, artist.artistId]);
};

export const deleteArtist = async (artistId: number) => {
    return execute<OkPacket>(artistQueries.deleteArtist, [artistId]);
};
