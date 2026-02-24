export const trackQueries = {
    readTracks: 'SELECT * FROM tracks WHERE album_id = ?',
    readAllTracks: 'SELECT * FROM tracks',
    createTrack: 'INSERT INTO tracks (album_id, title, number, video_url, lyrics) VALUES (?,?,?,?,?)',
    updateTrack: 'UPDATE tracks SET title = ?, number = ?, video_url = ?, lyrics = ? WHERE id = ?',
    deleteTrack: 'DELETE FROM tracks WHERE id = ?'
};
