import { Request, RequestHandler, Response } from 'express';
import { OkPacket } from 'mysql';
import * as TracksDao from './tracks.dao';

export const readTracks: RequestHandler = async (req: Request, res: Response) => {
    try {
        const tracks = await TracksDao.readAllTracks();

        res.status(200).json(
            tracks
        );
    } catch (error) {
        console.error('[tracks.controller][readTracks][Error] ', error);
        res.status(500).json({
            message: 'There was an error when fetching tracks'
        });
    }
};

export const createTrack: RequestHandler = async (req: Request, res: Response) => {
    try {
        const okPacket: OkPacket = await TracksDao.createTrackForAlbum(req.body);

        res.status(200).json(
            okPacket
        );
    } catch (error) {
        console.error('[tracks.controller][createTrack][Error] ', error);
        res.status(500).json({
            message: 'There was an error when creating tracks'
        });
    }
};

export const updateTrack: RequestHandler = async (req: Request, res: Response) => {
    try {
        const trackId = parseInt(req.params.trackId as string);
        if (!Number.isNaN(trackId)) {
            req.body.id = trackId;
        }

        const okPacket: OkPacket = await TracksDao.updateTrack(req.body);

        res.status(200).json(
            okPacket
        );
    } catch (error) {
        console.error('[tracks.controller][updateTrack][Error] ', error);
        res.status(500).json({
            message: 'There was an error when updating tracks'
        });
    }
};

export const deleteTrack: RequestHandler = async (req: Request, res: Response) => {
    try {
        const trackId = parseInt(req.params.trackId as string);
        if (Number.isNaN(trackId)) {
            throw new Error('Integer expected for trackId');
        }

        const response = await TracksDao.deleteTrack(trackId);
        res.status(200).json(
            response
        );
    } catch (error) {
        console.error('[tracks.controller][deleteTrack][Error] ', error);
        res.status(500).json({
            message: 'There was an error when deleting tracks'
        });
    }
};
