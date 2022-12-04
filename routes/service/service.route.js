import express from 'express';
import serviceController from '../../controllers/service/service.controller';
import { requireAuth } from '../../services/passport';
import { cache } from '../../services/caching';

const router = express.Router();


router.route('/')
    .post(
        requireAuth,
        serviceController.validateServiceBody(),
        serviceController.create
    ).get(serviceController.getAllPaginated);
router.route('/withoutPagenation/get')
    .get(serviceController.getAll);

router.route('/:serviceId')
    .put(
        requireAuth,
        serviceController.validateServiceBody(true),
        serviceController.update
    )
    .get(serviceController.getById)
    .delete(requireAuth,serviceController.delete);




export default router;