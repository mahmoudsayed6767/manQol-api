import express from 'express';
import SettingController from '../../controllers/setting/setting.controller';
import { requireAuth } from '../../services/passport';
import { cache } from '../../services/caching';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        SettingController.validateBody(),
        SettingController.create
    )
    .get(SettingController.findAll);
    
router.route('/:SettingId')
    .put(
        requireAuth,
        SettingController.validateBody(true),
        SettingController.update
    )
    .get(SettingController.findById)
    .delete( requireAuth,SettingController.delete);

export default router;