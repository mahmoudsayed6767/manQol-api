import ApiResponse from "../../helpers/ApiResponse";
import Report from "../../models/reports/report.model";
import ApiError from '../../helpers/ApiError';
import { checkExist, checkExistThenGet,isLng, isLat ,isInArray} from "../../helpers/CheckMethods";
import {  checkValidations,convertLang } from "../shared/shared.controller";
import { body } from "express-validator/check";
import Order from "../../models/order/order.model";
import Item from "../../models/item/item.model";
import User from "../../models/user/user.model";
import City from "../../models/city/city.model";
import i18n from "i18n";
import moment from "moment";
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import Notif from "../../models/notif/notif.model"
import { transformOrder, transformOrderById } from "../../models/order/transformOrder";
import { toImgUrl } from "../../utils";
import Logger from "../../services/logger";
const logger = new Logger('order '+ new Date(Date.now()).toDateString())
function validateDestination(location) {
    if (!isLng(location[0]))
        throw new Error(i18n.__('invalid.lng'));
    if (!isLat(location[1]))
    throw new Error(i18n.__('invalid.lat'));
}
const populateQuery = [
    { path: 'driver', model: 'user'},
    { path: 'client', model: 'user'},
    { path: 'city', model: 'city'},
    { path: 'items.item', model: 'item'},
    { path: 'items.services', model: 'service'},
];
export default {
    async findAll(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let {driver,status,client,country,city,startDate,endDate} = req.query
            let query = {deleted: false };
            if(client) query.client = client;
            if(driver) query.driver = driver;
            if(status) query.status = status;
            if(startDate && endDate){
                Object.assign(query, {"dateMillSec": {$gte :Date.parse( startDate) , $lte : Date.parse(endDate) }})//
            }
            await Order.find(query).populate(populateQuery)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit).then(async(data)=>{
                    let newdata = []
                    await Promise.all(data.map(async(e)=>{
                        let index = await transformOrder(e,lang)
                        newdata.push(index)
                    }))
                    const ordersCount = await Order.countDocuments(query);
                    const pageCount = Math.ceil(ordersCount / limit);
                    res.send(new ApiResponse(newdata, page, pageCount, limit, ordersCount, req));
                })
           
        } catch (err) {
            next(err);
        }
    },
    async findSelection(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let {driver,status,client,startDate,endDate} = req.query
            let query = {deleted: false };
            if(client) query.client = client;
            if(driver) query.driver = driver;
            if(status) query.status = status;
            if(startDate && endDate){
                Object.assign(query, {"dateMillSec": {$gte :Date.parse( startDate) , $lte : Date.parse(endDate) }})//
            }
            await Order.find(query).populate(populateQuery)
                .sort({ createdAt: -1 }).then(async(data)=>{
                    let newdata = []
                    await Promise.all(data.map(async(e)=>{
                        let index = await transformOrder(e,lang)
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
            let lang = i18n.getLocale(req)
            let { orderId } = req.params;
            await checkExist(orderId, Order, { deleted: false });
            await Order.findById(orderId).populate(populateQuery)
            .then(async(e)=>{
                let order = await transformOrderById(e,lang)
                res.send({success: true,data:order});
            })
        } catch (err) {
            next(err);
        }
    },
    validateBody(isUpdate = false) {
        let validations = [  
            body('date').not().isEmpty().withMessage((value, { req}) => {
                return req.__('date.required', { value});
            }).isISO8601().withMessage((value, { req}) => {
                return req.__('date.invalid', { value});
            }),
            body('fromAddress.location').not().isEmpty().withMessage((value, { req}) => {
                return req.__('location.required', { value});
            }).custom(async (value, { req }) => {
                validateDestination(req.body.fromAddress.location);
            }),
            body('fromAddress.city').optional().isNumeric().withMessage((value, { req}) => {
                return req.__('city.numeric', { value});
            }).custom(async (value, { req }) => {
                if (!await City.findOne({_id:value,deleted:false}))
                    throw new Error(req.__('city.invalid'));
                else
                    return true;
            }),
            body('fromAddress.address').not().isEmpty().withMessage((value, { req}) => {
                return req.__('address.required', { value});
            }),
            body('fromAddress.floor').not().isEmpty().withMessage((value, { req}) => {
                return req.__('floor.required', { value});
            }).isNumeric().withMessage((value, { req}) => {
                return req.__('floor.invalid', { value});
            }),
            body('fromAddress.elevator').not().isEmpty().withMessage((value, { req}) => {
                return req.__('elevator.required', { value});
            }).isBoolean().withMessage((value, { req}) => {
                return req.__('elevator.invalid', { value});
            }),
            body('toAddress.location').not().isEmpty().withMessage((value, { req}) => {
                return req.__('location.required', { value});
            }).custom(async (value, { req }) => {
                validateDestination(req.body.toAddress.location);
            }),
            body('toAddress.city').optional().isNumeric().withMessage((value, { req}) => {
                return req.__('city.numeric', { value});
            }).custom(async (value, { req }) => {
                if (!await City.findOne({_id:value,deleted:false}))
                    throw new Error(req.__('city.invalid'));
                else
                    return true;
            }),
            body('toAddress.address').not().isEmpty().withMessage((value, { req}) => {
                return req.__('address.required', { value});
            }),
            body('toAddress.floor').not().isEmpty().withMessage((value, { req}) => {
                return req.__('floor.required', { value});
            }).isNumeric().withMessage((value, { req}) => {
                return req.__('floor.invalid', { value});
            }),
            body('toAddress.elevator').not().isEmpty().withMessage((value, { req}) => {
                return req.__('elevator.required', { value});
            }).isBoolean().withMessage((value, { req}) => {
                return req.__('elevator.invalid', { value});
            }),
            body('items').optional().custom(async (items, { req }) => {
                for (let v of items) {
                    convertLang(req)
                    body('item').not().isEmpty().withMessage(async(val, { req}) => {
                        return req.__('item.required', { val});
                    }).isNumeric().withMessage((val, { req}) => {
                        return req.__('item.numeric', { val});
                    }).custom(async (val, { req }) => {
                        if (!await Item.findOne({_id:val,deleted:false}))
                            throw new Error(req.__('item.invalid'));
                        else
                            return true;
                    }),
                    body('services').not().isEmpty().withMessage(async(val, { req}) => {
                        return req.__('services.required', { val});
                    }),
                    body('count').not().isEmpty().withMessage(async(val, { req}) => {
                        return req.__('count.required', { val});
                    }).isNumeric().withMessage((val, { req}) => {
                        return req.__('count.numeric', { val});
                    })
                }
                return true;
            }),
            body('images').optional(),
            body('video').optional(),
            
        ];
        return validations;
    },
    async upload(req, res, next) {
        try {
            convertLang(req)
            let files = []
            if (req.files) {
                if (req.files['files']) {
                    let imagesList = [];
                    for (let imges of req.files['files']) {
                        imagesList.push(await toImgUrl(imges))
                    }
                    files = imagesList;
                }
            }
            console.log("files",files);
            res.status(201).send({
                success:true,
                files:files,
            });
        } catch (error) {
            next(error);
        }
    },
    async create(req, res, next) {
        try {
            convertLang(req)           
            const validatedBody = checkValidations(req);
            logger.info(`validatedBody order : ${JSON.stringify(validatedBody)}`);

            validatedBody.fromAddress.location = { type: 'Point', coordinates: [+req.body.fromAddress.location[0], +req.body.fromAddress.location[1]] };
            validatedBody.toAddress.location = { type: 'Point', coordinates: [+req.body.toAddress.location[0], +req.body.toAddress.location[1]] };
            validatedBody.client = req.user._id;
            validatedBody.dateMillSec = Date.parse(validatedBody.date)

            logger.info(`validatedBody: ${JSON.stringify(validatedBody)}`);
            let createdorder = await Order.create({ ...validatedBody});
            logger.info(`create order : ${createdorder.id}`);
            //send notification
            let theClient = await checkExistThenGet(req.user._id, User)
            //send notification to all drivers
            sendNotifiAndPushNotifi({
                targetUser: validatedBody.driver, 
                fromUser: req.user._id, 
                text: 'order Request ✌️',
                subject: createdorder._id,
                subjectType: theClient.fullname + ' just sent a request, view it now by clicking on the notification',
                info:'order'
            });
            let notif = {
                "description_en":theClient.fullname + ' just sent a request, view it now by clicking on the notification ',
                "description_ar":'طلب جديد فى انتظارك',
                "title_en":'order Request ✌️',
                "title_ar":'طلب جديد',
                "type":"ORDER"
            }
            await Notif.create({...notif,resource:req.user._id,target:validatedBody.driver,order:createdorder._id});

            let reports = {
                "action":"Create order",
                "type":"ORDER",
                "deepId":createdorder.id,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.status(201).send({
                success: true,
                data:createdorder
            });
        } catch (err) {
            logger.error(` order arr : ${err}`);
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            convertLang(req)
            let { orderId } = req.params;
            let order = await checkExistThenGet(orderId, Order, { deleted: false });
            
            //driver is not the driver of order
            if(req.user.type =="DRIVER" && req.user._id != order.driver)
                return next(new ApiError(403, i18n.__('notAllow')));
            //client is not the client of order
            if(req.user.type =="USER" && req.user._id != order.driver)
                return next(new ApiError(403, i18n.__('notAllow')));

            const validatedBody = checkValidations(req);
            validatedBody.fromAddress.location = { type: 'Point', coordinates: [+req.body.fromAddress.location[0], +req.body.fromAddress.location[1]] };
            validatedBody.toAddress.location = { type: 'Point', coordinates: [+req.body.toAddress.location[0], +req.body.toAddress.location[1]] };
            validatedBody.client = req.user._id
            validatedBody.dateMillSec = Date.parse(validatedBody.date)
            logger.info(`validatedBody update order : ${validatedBody}`);
            validatedBody.dateMillSec = Date.parse(validatedBody.date)
           
            await Order.findByIdAndUpdate(orderId, {
                ...validatedBody,
            }, { new: true });
            
            let reports = {
                "action":"Update order",
                "type":"ORDER",
                "deepId":orderId,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.status(200).send({success: true});
        }
        catch (err) {
            logger.error(`Update order error   : ${err}`);
            next(err);
        }
    },
    async cancel(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","USER"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let { orderId } = req.params;
            let order = await checkExistThenGet(orderId, Order, { deleted: false });
            //client is not the owner of order
            if(req.user.type =="USER" && req.user._id != order.client)
                return next(new ApiError(403, i18n.__('notAllow')));
            if(order.status != "PENDING")
                return next(new ApiError(500, i18n.__('notAllow')));
            order.status = 'CANCELED';
            await order.save();
            logger.info(` user ${req.user._id} canceled order  : ${orderId}`);
            let reports = {
                "action":"cancel order",
                "type":"ORDER",
                "deepId":orderId,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.status(200).send({success: true});

        }
        catch (err) {
            logger.error(` cancel order err  : ${err}`);
            next(err);
        }
    },
    async shipping(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","DRIVER"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let { orderId } = req.params;
            let order = await checkExistThenGet(orderId, Order, { deleted: false });
            //client is not the owner of order
            if(req.user.type =="DRIVER" && req.user._id != order.driver)
                return next(new ApiError(403, i18n.__('notAllow')));
            if(order.status != "ACCEPTED")
                return next(new ApiError(500, i18n.__('order.notAccept')));
            order.status = 'SHIPPING';
            await order.save();
            logger.info(` user ${req.user._id} shipping order  : ${orderId}`);
            let reports = {
                "action":"shipping order",
                "type":"ORDER",
                "deepId":orderId,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.status(200).send({success: true});

        }
        catch (err) {
            logger.error(` shipping order err  : ${err}`);
            next(err);
        }
    },
    async delivered(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN","DRIVER"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let { orderId } = req.params;
            let order = await checkExistThenGet(orderId, Order, { deleted: false });
            //client is not the owner of order
            if(req.user.type =="DRIVER" && req.user._id != order.driver)
                return next(new ApiError(403, i18n.__('notAllow')));
            if(order.status != "SHIPPING")
                return next(new ApiError(500, i18n.__('order.notShipping')));
            order.status = 'DELIVERED';
            await order.save();
            logger.info(` user ${req.user._id} delivered order  : ${orderId}`);
            let reports = {
                "action":"delivered order",
                "type":"ORDER",
                "deepId":orderId,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.status(200).send({success: true});

        }
        catch (err) {
            logger.error(` delivered order err  : ${err}`);
            next(err);
        }
    },
    async delete(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            
            let { orderId } = req.params;
            let order = await checkExistThenGet(orderId, Order, { deleted: false });
            order.deleted = true;
            await order.save();
            let reports = {
                "action":"delete order",
                "type":"ORDER",
                "deepId":orderId,
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