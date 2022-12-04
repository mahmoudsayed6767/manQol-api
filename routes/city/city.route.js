import express from 'express';
import { requireAuth } from '../../services/passport';
import CityController from '../../controllers/city/city.controller';

const router = express.Router();

router.route('/')
    .post(
        requireAuth,
        CityController.validateCityBody(),
        CityController.create
    )
router.route('/:country/countries')
    .get(CityController.getAllPaginated);

router.route('/:country/countries/withoutPagenation/get')
    .get(CityController.getAll);

router.route('/:cityId')
    .put(
        requireAuth,
        CityController.validateCityBody(true),
        CityController.update
    )
    .get(requireAuth,CityController.getById)
    .delete(requireAuth,CityController.delete);


export default router;