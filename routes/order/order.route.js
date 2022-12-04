import express from 'express';
import orderController from '../../controllers/order/order.controller';
import { requireAuth } from '../../services/passport';
import { multerSaveTo } from '../../services/multer-service';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        orderController.validateBody(),
        orderController.create
    )
    .get(requireAuth,orderController.findAll);
router.route('/upload')
    .post(
        requireAuth,
        multerSaveTo('files').fields([
            { name: 'files', maxCount: 6, options: false },
        ]),
        orderController.upload
    )
router.route('/withoutPagenation/get')
    .get(requireAuth,orderController.findSelection);
router.route('/:orderId')
    .put(
        requireAuth,
        orderController.validateBody(true),
        orderController.update
    )
    .get( requireAuth,orderController.findById)
    .delete( requireAuth,orderController.delete);

router.route('/:orderId/cancel')
    .put(
        requireAuth,
        orderController.cancel
    )
router.route('/:orderId/shipping')
    .put(
        requireAuth,
        orderController.shipping
    )
router.route('/:orderId/deliverd')
    .put(
        requireAuth,
        orderController.delivered
    )
export default router;