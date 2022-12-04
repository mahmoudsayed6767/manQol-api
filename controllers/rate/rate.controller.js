
import User from "../../models/user/user.model";
import i18n from "i18n";
import { body } from "express-validator/check";
import { checkValidations,convertLang } from "../shared/shared.controller";
import ApiError from "../../helpers/ApiError";
import { checkExist } from "../../helpers/CheckMethods";
import ApiResponse from "../../helpers/ApiResponse";
import { checkExistThenGet,isInArray } from "../../helpers/CheckMethods";
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import Notif from "../../models/notif/notif.model";
import Rate from "../../models/rate/rate.model";
import Logger from "../../services/logger";
const logger = new Logger('rate '+ new Date(Date.now()).toDateString())
const populateQuery = [
    {
        path: 'user', model: 'user',
        populate: { path: 'country', model: 'country' },
    },
];
export default {
    //rate validatedBody
    ratValidateBody(isUpdate = false) {
        let validations = [
            body('comment').optional(),
            body('rate').not().isEmpty().withMessage((value, { req}) => {
                return req.__('rate.required', { value});
            })
            .isNumeric().withMessage((value, { req}) => {
                return req.__('rate.numeric', { value});
            }).isLength({min:1}).withMessage((value, { req}) => {
                return req.__('rate.atLeast', { value}); 
            }),
            body('driver').not().isEmpty().withMessage((value, { req}) => {
                return req.__('driver.required', { value});
            }).isNumeric().withMessage((value, { req}) => {
                return req.__('driver.numeric', { value});
            }),
            body('order').optional().isNumeric().withMessage((value, { req}) => {
                return req.__('order.numeric', { value});
            })
            
            
        ];
        return validations;
    },
    //rate driver 
    async create(req, res, next) {
        try {
            convertLang(req)
            const validatedBody = checkValidations(req);
            if(validatedBody.comment){
                validatedBody.haveComment = true;
            }else{
                validatedBody.haveComment = false;
            }
            let rated = await checkExistThenGet(validatedBody.driver, User, { deleted: false });
            
            validatedBody.user = req.user._id;
            logger.error(`validatedBody rate : ${validatedBody}`);
            let rateCreated = await Rate.create({ ...validatedBody });
            logger.info(`rateCreated   ${rateCreated.id}`);
            // add the new rate to driver or adveristment rate
            let newRate = rated.rateCount + parseInt(validatedBody.rate);
            rated.rateCount = newRate;
            rated.rateNumbers = rated.rateNumbers + 1;
            let totalDegree = rated.rateNumbers * 5; 
            let degree = newRate * 100
            let ratePrecent = degree / totalDegree;
            let rate = ratePrecent / 20
            rated.rate = Math.ceil(parseInt(rate));
            await rated.save();
            //if driver send notification to driver

            return res.status(200).send({
                success:true,
                data:rateCreated
            });
        } catch (error) {
            logger.error(`create rate error: ${error}`);
            next(error);
        }
    },
    async getById(req, res, next) {
        try {
            convertLang(req)
            let { rateId } = req.params;
            
            await checkExist(rateId, Rate, { deleted: false });

            let rate = await Rate.findById(rateId)
            return res.status(200).send({
                success:true,
                data:rate
            });
        } catch (error) {
            next(error);
        }
    },
    //update rate comment or value
    async update(req, res, next) {
        try {
            convertLang(req)           
            let user = req.user;
            let { rateId } = req.params;
            const validatedBody = checkValidations(req);
            let theRate = await checkExistThenGet(rateId,Rate,{deleted:false})
            //user is not the owner of rate and not admin
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type)){
                if(req.user._id != theRate.user){
                    return next(new ApiError(403, i18n.__('admin.auth')));
                }
            }
            let rated = await checkExistThenGet(theRate.driver, User, { deleted: false });
            
           
            await Rate.findByIdAndUpdate(rateId, { ...validatedBody });

            let newRate = rated.rateCount + parseInt(validatedBody.rate - theRate.rate);
            rated.rateCount = newRate;
            //rated.rateNumbers = rated.rateNumbers + 1;
            let totalDegree = rated.rateNumbers * 5; 
            let degree = newRate * 100
            let ratePrecent = degree / totalDegree;
            let rate = ratePrecent / 20
            rated.rate = Math.ceil(parseInt(rate));
            await rated.save();
            return res.status(200).send({
                success:true,
                data: await Rate.findById(rateId)
            });
        } catch (error) {
            next(error);
        }
    },
    //get without pagenation
    async getAll(req, res, next) {
        try {
            convertLang(req)
            let {driver} = req.query
            let query={deleted:false,haveComment: true}
            if(haveComment) query.haveComment = true

            if(driver){
                query.driver = driver
            }
            await Rate.find(query)
            .populate(populateQuery)
            .then(async(data)=>{
                let newdata = []
                data.map(async(e) =>{
                    let value ={
                        rate: e.rate,
                        comment: e.comment,
                        driver: e.driver,
                        order: e.order,
                        id: e._id,
                        user:{
                            fullname:e.user.fullname,
                            img:e.user.img?e.user.img:"",
                            type:e.user.type,
                            online:e.user.online,
                            id:e.user._id, 
                        }
                    }
                    newdata.push(value)
                })
                res.status(200).send({
                    success:true,
                    data:newdata
                });
            })
        } catch (error) {
            next(error);
        }
    },
    //get with pagenation
    async getAllPaginated(req, res, next) {
        try {   
            convertLang(req)      
            let page = +req.query.page || 1, limit = +req.query.limit || 20,
            {driver} = req.query
            let query={deleted:false,haveComment: true}
            if(driver){
                query.driver = driver
            }
            await Rate.find(query)
            .populate(populateQuery)
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 })
            .then(async(data)=>{
                let newdata = []
                data.map(async(e) =>{
                    let value ={
                        rate: e.rate,
                        comment: e.comment,
                        driver: e.driver,
                        order: e.order,
                        id: e._id,
                        user:{
                            fullname:e.user.fullname,
                            img:e.user.img?e.user.img:"",
                            type:e.user.type,
                            online:e.user.online,
                            id:e.user._id, 
                        }
                    }
                    await newdata.push(value)
                })
                let count = await Rate.countDocuments(query);

                const pageCount = Math.ceil(count / limit);
                res.send(new ApiResponse(newdata, page, pageCount, limit, count, req));
            })
            
        } catch (error) {
            next(error);
        }
    },

    //delete
    async delete(req, res, next) {
        
        try {
            convertLang(req)
            
            let { rateId } = req.params;
            let theRate = await checkExistThenGet(rateId, Rate,{deleted:false});
            //user is not the owner of rate and not admin
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type)){
                if(req.user._id != theRate.user){
                    return next(new ApiError(403, i18n.__('admin.auth')));
                }
            }
            
            theRate.deleted = true;
            let rated = await checkExistThenGet(theRate.driver, User, { deleted: false });
            let newRate = rated.rateCount - parseInt(theRate.rate);
            rated.rateCount = newRate;
            rated.rateNumbers = rated.rateNumbers - 1;
            let totalDegree = rated.rateNumbers * 5; 
            let degree = newRate * 100
            if(degree != 0){
                let ratePrecent = degree / totalDegree;
                let rate = ratePrecent / 20
                rated.rate = Math.ceil(parseInt(rate));
            }else{
                rated.rate = 0
            }
            await rated.save();
            await theRate.save();
            res.send({success: true});

        } catch (err) {
            next(err);
        }
    },


}