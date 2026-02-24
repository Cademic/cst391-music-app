import { Router } from 'express';
import * as ArtistsController from './artists.controller';

const router = Router();
router
    .route('/artists')
    .get(ArtistsController.readArtists)
    .post(ArtistsController.createArtist);

router
    .route('/artists/:artistId')
    .put(ArtistsController.updateArtist)
    .delete(ArtistsController.deleteArtist);

export default router;
