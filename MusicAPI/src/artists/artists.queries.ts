export const artistQueries = {
    readArtists: 'SELECT * FROM artists',
    createArtist: 'INSERT INTO artists (artist) VALUES (?)',
    updateArtist: 'UPDATE artists SET artist = ? WHERE artistId = ?',
    deleteArtist: 'DELETE FROM artists WHERE artistId = ?'
};
