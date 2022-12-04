import express from 'express';
import adminController from '../../controllers/admin/admin.controller';

const router = express.Router();
router.route('/lastUsers')
    .get(adminController.getLastUser);

router.route('/lastBooking')
    .get(adminController.getLastBookings);

router.route('/count')
    .get(adminController.count);
export default router;
