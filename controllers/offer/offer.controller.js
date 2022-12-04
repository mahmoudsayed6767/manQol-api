import ApiResponse from "../../helpers/ApiResponse";
import Report from "../../models/reports/report.model";
import ApiError from '../../helpers/ApiError';
import { checkExist, checkExistThenGet,isLng, isLat ,isInArray} from "../../helpers/CheckMethods";
import { checkValidations,convertLang } from "../shared/shared.controller";
import { body } from "express-validator/check";
import Offer from "../../models/offer/offer.model";
import Order from "../../models/order/order.model";
import User from "../../models/user/user.model";
import i18n from "i18n";
import moment from "moment";
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import Notif from "../../models/notif/notif.model"
import { transformOffer, transformOfferById } from "../../models/offer/transformOffer";
import Logger from "../../services/logger";
const logger = new Logger('offer '+ new Date(Date.now()).toDateString())
function validateDestination(location) {
    if (!isLng(location[0]))
        throw new Error(i18n.__('invalid.lng'));
    if (!isLat(location[1]))
    throw new Error(i18n.__('invalid.lat'));
}
const populateQuery = [
    { path: 'driver', model: 'user'},
    { path: 'client', model: 'user'},
    { path: 'order', model: 'order' },
];
export default {
    async findAll(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let {driver,status,client,order,startDate,endDate} = req.query
            let query = {deleted: false };
            if(client) query.client = client;
            if(driver) query.driver = driver;
            if(status) query.status = status;
            if(order) query.order = order;
            if(startDate && endDate){
                Object.assign(query, {"startDateMillSec": {$gte :Date.parse( startDate) , $lte : Date.parse(endDate) }})//
            }
            await Offer.find(query).populate(populateQuery)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit).then(async(data)=>{
                    let newdata = []
                    await Promise.all(data.map(async(e)=>{
                        let index = await transformOffer(e,lang)
                        newdata.push(index)
                    }))
                    const offersCount = await Offer.countDocuments(query);
                    const pageCount = Math.ceil(offersCount / limit);
                    res.send(new ApiResponse(newdata, page, pageCount, limit, offersCount, req));
                })
           
        } catch (err) {
            next(err);
        }
    },
    async findSelection(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let {driver,status,client,order,startDate,endDate} = req.query
            let query = {deleted: false };

            if(client) query.client = client;
            if(driver) query.driver = driver;
            if(status) query.status = status;
            if(order) query.order = order;
            if(startDate && endDate){
                Object.assign(query, {"startDateMillSec": {$gte :Date.parse( startDate) , $lte : Date.parse(endDate) }})//
            }
            await Offer.find(query).populate(populateQuery)
                .sort({ createdAt: -1 }).then(async(data)=>{
                    let newdata = []
                    await Promise.all(data.map(async(e)=>{
                        let index = await transformOffer(e,lang)
                        newdata.push(index)
                    }))
                    res.send({success: true,data:newdata});
                })
        } catch (err) {
            next(err);
        }
    },
    async findById(req, res, next) {
        try {
            convertLang(req)
            let { offerId } = req.params;
            await checkExist(offerId, Offer, { deleted: false });
            await Offer.findById(offerId).populate(populateQuery)
            .then(async(e)=>{
                let offer = await transformOfferById(e,lang)
                res.send({success: true,data:offer});
            })
        } catch (err) {
            next(err);
        }
    },
    validateBody(isUpdate = false) {
        let validations = [
            body('driver').not().isEmpty().withMessage((value, { req}) => {
                return req.__('driver.required', { value});
            }).custom(async (value, { req }) => {
                if (!await User.findOne({_id:value,deleted:false}))
                    throw new Error(req.__('driver.invalid'));
                else
                    return true;
            }),
            body('price').not().isEmpty().withMessage((value, { req}) => {
                return req.__('price.required', { value});
            }),
            body('location').not().isEmpty().withMessage((value, { req}) => {
                return req.__('location.required', { value});
            }),   
            body('order').not().isEmpty().withMessage((value, { req}) => {
                return req.__('order.required', { value});
            }).isNumeric().isNumeric().withMessage((value, { req}) => {
                return req.__('order.numeric', { value});
            }).custom(async (value, { req }) => {
                if (!await Order.findOne({_id:value,deleted:false}))
                    throw new Error(req.__('order.invalid'));
                else
                    return true;
            }),
        ];
        return validations;
    },
    async create(req, res, next) {
        try {
            convertLang(req)           
            const validatedBody = checkValidations(req);
            logger.info(`validatedBody offer : ${validatedBody}`);

            validateDestination(validatedBody.location);
            validatedBody.location = { type: 'Point', coordinates: [+req.body.location[0], +req.body.location[1]] };
            validatedBody.client = req.user._id
            logger.info(`validatedBody: ${validatedBody}`);
            let createdOffer = await Offer.create({ ...validatedBody});
            logger.info(`create offer : ${createdOffer.id}`);
            //send notification
            let theClient = await checkExistThenGet(req.user._id, User)
            //send notification to driver
            sendNotifiAndPushNotifi({
                targetUser: validatedBody.driver, 
                fromUser: req.user._id, 
                text: 'offer ✌️',
                subject: createdOffer._id,
                subjectType: theClient.fullname + ' just sent you a offer, view it now by clicking on the notification',
                info:'offer'
            });
            let notif = {
                "description_en":theClient.fullname + ' just sent you a offer, view it now by clicking on the notification ',
                "description_ar":'طلب حجز جديد فى انتظارك',
                "title_en":'offer ✌️',
                "title_ar":'طلب حجز جديد',
                "type":"OFFER"
            }
            await Notif.create({...notif,resource:req.user._id,target:validatedBody.driver,offer:createdOffer._id});

            let reports = {
                "action":"Create offer",
                "type":"OFFER",
                "deepId":createdOffer.id,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.status(201).send({
                success: true,
                data:createdOffer
            });
        } catch (err) {
            logger.error(` offer arr : ${err}`);
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            convertLang(req)
            let { offerId } = req.params;
            let offer = await checkExistThenGet(offerId, Offer, { deleted: false });
            
            //driver is not the driver of offer
            if(req.user.type =="DRIVER" && req.user._id != offer.driver)
                return next(new ApiError(403, i18n.__('notAllow')));
            //client is not the client of offer
            if(req.user.type =="USER" && req.user._id != offer.driver)
                return next(new ApiError(403, i18n.__('notAllow')));

            const validatedBody = checkValidations(req);
            logger.info(`validatedBody update offer : ${validatedBody}`);
            validateDestination(validatedBody.location);
            validatedBody.location = { type: 'Point', coordinates: [+req.body.location[0], +req.body.location[1]] };

            await Offer.findByIdAndUpdate(offerId, {
                ...validatedBody,
            }, { new: true });
            
            let reports = {
                "action":"Update offer",
                "type":"OFFER",
                "deepId":offerId,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.status(200).send({success: true});
        }
        catch (err) {
            logger.error(`Update offer error   : ${err}`);
            next(err);
        }
    },
    async reject(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","DRIVER"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let { offerId } = req.params;
            let offer = await checkExistThenGet(offerId, Offer, { deleted: false });
            //driver is not the driver of offer
            if(req.user.type =="DRIVER" && req.user._id != offer.driver)
                return next(new ApiError(403, i18n.__('notAllow')));
            logger.info(` user ${req.user._id} reject offer  : ${offerId}`);
            
            sendNotifiAndPushNotifi({
                targetUser: offer.client, 
                fromUser: offer.driver, 
                text: " your's offer Status",
                subject: offer.id,
                subjectType: 'Unfortunately, your offer was rejected.',
                info: 'offer'
            });
            let notif = {
                "description_en":'Unfortunately, your offer was rejected.',
                "description_ar":"العرض الخاص بك تم رفضه" ,
                "title_en":" your's offer Status",
                "title_ar":"تحديث بخصوص عرضك ",
                "type":"OFFER"
            }
            await Notif.create({...notif,resource:offer.driver,target:offer.client,offer:offer.id});    
        
        
            offer.status = 'REJECTED';
            await offer.save();
            let reports = {
                "action":"Reject offer",
                "type":"OFFER",
                "deepId":offerId,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
    async accept(req, res, next) {
        try {
            convertLang(req)
            let { offerId } = req.params;
            let offer = await checkExistThenGet(offerId, Offer, { deleted: false });
            
            if(!isInArray(["ADMIN","SUB-ADMIN","DRIVER"],req.user.type)){
                return next(new ApiError(403, i18n.__('admin.auth')));
            }
            if(offer.status != "PENDING")
                return next(new ApiError(500, i18n.__('notAllow')));

            let order = await checkExistThenGet(offer.order,Order);
            if(order.status != "PENDING")
                return next(new ApiError(500, i18n.__('offer.notPending')));
                
            //offer in the same duration 
            let oldOffers = await Offer.find({
                deleted: false,
                driver: Offer.driver,
                order: offer.order
            })
            for (let i of oldOffers) {
                i.status = "REJECTED";
                sendNotifiAndPushNotifi({
                    targetUser: offer.client, 
                    fromUser: offer.driver, 
                    text: "your's offer Status",
                    subject: offer.id,
                    subjectType: 'Unfortunately, your offer was rejected.',
                    info: 'offer'
                });
                let notif = {
                    "description_en":'Unfortunately, your offer was rejected',
                    "description_ar":"العرض الخاص بك تم رفضه" ,
                    "title_en":" your's offer Status",
                    "title_ar":"تحديث بخصوص حجزك ",
                    "type":"OFFER"
                }
                await Notif.create({...notif,resource:i.driver,target:i.client,offer:i.id});
                await i.save();
            }
            offer.status = 'ACCEPTED';
            order.driver = offer.driver;
            order.status = "ACCEPTED";
            await order.save();

            await offer.save();
            
            logger.info(` user ${req.user._id} accept offer  : ${offerId}`);
            sendNotifiAndPushNotifi({
                targetUser: offer.client, 
                fromUser: offer.driver, 
                text: " your's offer Status",
                subject: offer.id,
                subjectType: 'Yayy! your offer is accepted. ',
                info: 'offer'
            });
            let notif = {
                "description_en":'Yayy! your offer is accepted. ',
                "description_ar":"طلب الحجز الخاص بك تم الموافقه عليه" ,
                "title_en":" yur's offer Status",
                "title_ar":"تحديث بخصوص الحجز الخاص بك",
                "type":"OFFER"
            }
            await Notif.create({...notif,resource:offer.driver,target:offer.client,offer:offer.id});
            let reports = {
                "action":"accept offer",
                "type":"OFFER",
                "deepId":offerId,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.status(200).send({success: true});

        }
        catch (err) {
            logger.error(` offer err  : ${err}`);
            next(err);
        }
    },
    async delete(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            
            let { offerId } = req.params;
            let offer = await checkExistThenGet(offerId, Offer, { deleted: false });
            offer.deleted = true;
            await offer.save();
            let reports = {
                "action":"delete offer",
                "type":"OFFER",
                "deepId":offerId,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.status(200).send({success: true});

        }
        catch (err) {
            next(err);
        }
    },
};