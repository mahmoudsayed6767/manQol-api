import express from 'express';
import rateController from '../../controllers/rate/rate.controller';
import { multerSaveTo } from '../../services/multer-service';
import { requireAuth } from '../../services/passport';
import { cache } from '../../services/caching'

const router = express.Router();


router.route('/')
    .post(
        requireAuth,
        rateController.ratValidateBody(),
        rateController.create
    )
    .get(rateController.getAllPaginated);

router.route('/:rateId')
    .put(
        requireAuth,
        rateController.ratValidateBody(true),
        rateController.update
    )
    .get(rateController.getById)
    .delete(requireAuth,rateController.delete);

router.route('/withoutPagenation/get')

    .get(rateController.getAll);




export default router;