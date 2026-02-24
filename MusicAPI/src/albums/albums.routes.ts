import { Router } from 'express';
import * as AlbumsController from './albums.controller';

const router = Router();
router.
    route('/albums').
    get(AlbumsController.readAlbums).
    post(AlbumsController.createAlbum);

router.
    route('/albums/:albumId').
    get(AlbumsController.readAlbumById).
    put(AlbumsController.updateAlbum).
    delete(AlbumsController.deleteAlbum);

export default router;