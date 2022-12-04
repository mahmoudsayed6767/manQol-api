import express from 'express';
import userRoute from './user/user.route';
import orderRoute  from './order/order.route';
import ReportRoute  from './reports/report.route';
import NotifRoute  from './notif/notif.route';
import AboutRoute  from './about/about.route';
//import AdminRoute  from './admin/admin.route';
import offerRoute  from './offer/offer.route';
import rateRoute  from './rate/rate.route';
import termsRoute  from './terms/terms.route';
import settingRoute  from './setting/setting.route';
import contactRoute  from './contact/contact.route';
import countriesRoute  from './country/country.route';
import ItemsRoute  from './item/item.route';
import CitiesRoute  from './city/city.route';
import ServicesRoute  from './service/service.route';

import { requireAuth } from '../services/passport';

const router = express.Router();

router.use('/', userRoute);
router.use('/services', ServicesRoute);

router.use('/cities', CitiesRoute);
router.use('/contact-us',contactRoute);
router.use('/countries',countriesRoute);
router.use('/orders',orderRoute);
router.use('/setting',settingRoute);
router.use('/reports',requireAuth, ReportRoute);
router.use('/notif',requireAuth, NotifRoute);
//router.use('/admin',requireAuth, AdminRoute);
router.use('/about',AboutRoute);
router.use('/rate',rateRoute);
router.use('/offers',offerRoute);
router.use('/terms',termsRoute);
router.use('/items',ItemsRoute)
export default router;
