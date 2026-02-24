import { Request, RequestHandler, Response } from 'express';
import { OkPacket } from 'mysql';
import { Album } from './albums.model';
import { Track } from '../tracks/tracks.model';
import * as AlbumDao from './albums.dao';
import * as TracksDao from '../tracks/tracks.dao';

export const readAlbums: RequestHandler = async (req: Request, res: Response) => {
    try {
        const albums = await AlbumDao.readAlbums();
        await readTracks(albums, res);

        res.status(200).json(
            albums
        );
    } catch (error) {
        console.error('[albums.controller][readAlbums][Error] ', error);
        res.status(500).json({
            message: 'There was an error when fetching albums'
        });
    }
};

export const readAlbumById: RequestHandler = async (req: Request, res: Response) => {
    try {
        const albumId = parseInt(req.params.albumId as string);
        if (Number.isNaN(albumId)) {
            throw new Error('Integer expected for albumId');
        }

        const albums = await AlbumDao.readAlbumsByAlbumId(albumId);
        await readTracks(albums, res);

        res.status(200).json(
            albums
        );
    } catch (error) {
        console.error('[albums.controller][readAlbumById][Error] ', error);
        res.status(500).json({
            message: 'There was an error when fetching albums'
        });
    }
};

export const createAlbum: RequestHandler = async (req: Request, res: Response) => {
    try {
        const okPacket: OkPacket = await AlbumDao.createAlbum(req.body);

        console.log('req.body', req.body);

        console.log('album', okPacket);

        (req.body.tracks || []).forEach(async (track: Track, index: number) => {
            try {
                await TracksDao.createTrack(track, index, okPacket.insertId);
            } catch (error) {
                console.error('[albums.controller][createAlbumTracks][Error] ', error);
                res.status(500).json({
                    message: 'There was an error when writing album tracks'
                });
            }
        });

        res.status(200).json(
            okPacket
        );
    } catch (error) {
        console.error('[albums.controller][createAlbum][Error] ', error);
        res.status(500).json({
            message: 'There was an error when writing albums'
        });
    }
};

export const updateAlbum: RequestHandler = async (req: Request, res: Response) => {
    try {
        const albumId = parseInt(req.params.albumId as string);
        if (!Number.isNaN(albumId)) {
            req.body.id = albumId;
        }
        const okPacket: OkPacket = await AlbumDao.updateAlbum(req.body);

        console.log('req.body', req.body);

        console.log('album', okPacket);

        (req.body.tracks || []).forEach(async (track: Track, index: number) => {
            try {
                await TracksDao.updateTrack(track);
            } catch (error) {
                console.error('[albums.controller][updateAlbum][Error] ', error);
                res.status(500).json({
                    message: 'There was an error when updating album tracks'
                });
            }
        });

        res.status(200).json(
            okPacket
        );
    } catch (error) {
        console.error('[albums.controller][updateAlbum][Error] ', error);
        res.status(500).json({
            message: 'There was an error when updating albums'
        });
    }
};

async function readTracks(albums: Album[], res: Response<any, Record<string, any>>) {
    for (let i = 0; i < albums.length; i++) {
        try {
            const album = albums[i];
            if (!album) {
                continue;
            }
            const tracks = await TracksDao.readTracks(album.id);
            album.tracks = tracks;
        } catch (error) {
            console.error('[albums.controller][readTracks][Error] ', error);
            res.status(500).json({
                message: 'There was an error when fetching album tracks'
            });
        }
    }
}

export const deleteAlbum: RequestHandler = async (req: Request, res: Response) => {
    try {
        let albumId = parseInt(req.params.albumId as string);

        console.log('albumId', albumId);
        if (!Number.isNaN(albumId)) {
            const response = await AlbumDao.deleteAlbum(albumId);
            res.status(200).json(
                response
            );
        } else {
            throw new Error('Integer expected for albumId');
        }

    } catch (error) {
        console.error('[albums.controller][deleteAlbum][Error] ', error);
        res.status(500).json({
            message: 'There was an error when deleting albums'
        });
    }
};
