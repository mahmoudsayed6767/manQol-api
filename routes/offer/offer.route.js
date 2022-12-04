import express from 'express';
import offerController from '../../controllers/offer/offer.controller';
import { requireAuth } from '../../services/passport';
const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        offerController.validateBody(),
        offerController.create
    )
    .get(requireAuth,offerController.findAll);
router.route('/withoutPagenation/get')
    .get(requireAuth,offerController.findSelection);
router.route('/:offerId')
    .put(
        requireAuth,
        offerController.validateBody(true),
        offerController.update
    )
    .get( requireAuth,offerController.findById)
    .delete( requireAuth,offerController.delete);

router.route('/:offerId/accept')
    .put(
        requireAuth,
        offerController.accept
    )
router.route('/:offerId/reject')
    .put(
        requireAuth,
        offerController.reject
    )

export default router;