import { Router } from 'express';
import * as TracksController from './tracks.controller';

const router = Router();
router
    .route('/tracks')
    .get(TracksController.readTracks)
    .post(TracksController.createTrack);

router
    .route('/tracks/:trackId')
    .put(TracksController.updateTrack)
    .delete(TracksController.deleteTrack);

export default router;
