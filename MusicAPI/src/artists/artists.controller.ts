import { Request, RequestHandler, Response } from 'express';
import { OkPacket } from 'mysql';
import * as ArtistDao from './artists.dao';

export const readArtists: RequestHandler = async (req: Request, res: Response) => {
    try {
        const artists = await ArtistDao.readArtists();

        res.status(200).json(
            artists
        );
    } catch (error) {
        console.error('[artists.controller][readArtists][Error] ', error);
        res.status(500).json({
            message: 'There was an error when fetching artists'
        });
    }
};

export const createArtist: RequestHandler = async (req: Request, res: Response) => {
    try {
        const okPacket: OkPacket = await ArtistDao.createArtist(req.body);

        res.status(200).json(
            okPacket
        );
    } catch (error) {
        console.error('[artists.controller][createArtist][Error] ', error);
        res.status(500).json({
            message: 'There was an error when creating artists'
        });
    }
};

export const updateArtist: RequestHandler = async (req: Request, res: Response) => {
    try {
        const artistId = parseInt(req.params.artistId as string);
        if (!Number.isNaN(artistId)) {
            req.body.artistId = artistId;
        }

        const okPacket: OkPacket = await ArtistDao.updateArtist(req.body);

        res.status(200).json(
            okPacket
        );
    } catch (error) {
        console.error('[artists.controller][updateArtist][Error] ', error);
        res.status(500).json({
            message: 'There was an error when updating artists'
        });
    }
};

export const deleteArtist: RequestHandler = async (req: Request, res: Response) => {
    try {
        const artistId = parseInt(req.params.artistId as string);
        if (Number.isNaN(artistId)) {
            throw new Error('Integer expected for artistId');
        }

        const response = await ArtistDao.deleteArtist(artistId);
        res.status(200).json(
            response
        );
    } catch (error) {
        console.error('[artists.controller][deleteArtist][Error] ', error);
        res.status(500).json({
            message: 'There was an error when deleting artists'
        });
    }
};
