export const albumQueries = {
    readAlbums: 'SELECT * FROM albums',
    readAlbumsByArtist: 'SELECT * FROM albums WHERE artist = ?',
    readAlbumsByArtistSearch: 'SELECT * FROM albums WHERE artist LIKE ?',
    readAlbumsByDescriptionSearch: 'SELECT * FROM albums WHERE description LIKE ?',
    readAlbumsByAlbumId: 'SELECT * FROM albums WHERE id = ?',
    createAlbum: 'INSERT INTO albums (title, artist, description, year, image) VALUES (?,?,?,?,?)',
    updateAlbum: 'UPDATE albums SET title = ?, artist = ?, year = ?, image = ?, description = ? WHERE id = ?',
    deleteAlbum: 'DELETE FROM albums WHERE id = ?'
};
