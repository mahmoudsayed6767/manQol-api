import express from 'express';
import itemController from '../../controllers/item/item.controller';
import { requireAuth } from '../../services/passport';
import { cache } from '../../services/caching';

const router = express.Router();


router.route('/')
    .post(
        requireAuth,
        itemController.validateItemBody(),
        itemController.create
    ).get(itemController.getAllPaginated);
router.route('/withoutPagenation/get')
    .get(itemController.getAll);

router.route('/:itemId')
    .put(
        requireAuth,
        itemController.validateItemBody(true),
        itemController.update
    )
    .get(itemController.getById)
    .delete(requireAuth,itemController.delete);




export default router;