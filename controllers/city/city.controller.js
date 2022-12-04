import City from "../../models/city/city.model";
import Report from "../../models/reports/report.model";
import { body } from "express-validator/check";
import { checkValidations,convertLang,handleImg} from "../shared/shared.controller";
import ApiError from "../../helpers/ApiError";
import { checkExist,isInArray } from "../../helpers/CheckMethods";
import ApiResponse from "../../helpers/ApiResponse";
import { checkExistThenGet } from "../../helpers/CheckMethods";
import i18n from "i18n";

export default {
    //validate body
    validateCityBody(isUpdate = false) {
        let validations = [
            body('name_en').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('name_en.required', { value});
            }),
            body('name_ar').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('name_ar.required', { value});
            }),
            body('country').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('country.required', { value});
            }).isNumeric().withMessage((value, { req}) => {
                return req.__('country.numeric', { value});
            }),
            
        ];
        return validations;
    },
    //add new city
    async create(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            const validatedBody = checkValidations(req);
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let city = await City.create({ ...validatedBody });
            let reports = {
                "action":"Create New City",
                "type":"CITIES",
                "deepId":city.id,
                "user": req.user._id
            };
            await Report.create({...reports });
            await City.findById(city.id).then( e => {
                let city ={
                    name:lang=="ar"?e.name_ar:e.name_en,
                    name_ar:e.name_ar,
                    name_en:e.name_en,
                    country:e.country,
                    img:e.img,
                    id: e._id,
                    createdAt: e.createdAt,
                }
                res.status(201).send({
                    success:true,
                    data:city
                });
            })
        } catch (error) {
            next(error);
        }
    },
    async createMulti(req, res, next) {
        try {
            convertLang(req)
            let data = req.body.data
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                await City.create({ ...item });
                
            }
            res.status(201).send({success:true});
        } catch (error) {
            next(error);
        }
    },
    //get by id
    async getById(req, res, next) {
        try {
            convertLang(req)
             //get lang
            let lang = i18n.getLocale(req)
            let { cityId } = req.params;
            
            await checkExist(cityId, City, { deleted: false });

            await City.findById(cityId).then( e => {
                let city ={
                    name:lang=="ar"?e.name_ar:e.name_en,
                    name_ar:e.name_ar,
                    name_en:e.name_en,
                    country:e.country,
                    img:e.img,
                    id: e._id,
                    createdAt: e.createdAt,
                }
                res.send({
                    success:true,
                    data:city
                });
            })
        } catch (error) {
            next(error);
        }
    },
    //update city
    async update(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let { cityId } = req.params;
            await checkExist(cityId,City, { deleted: false })
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            const validatedBody = checkValidations(req);
            await City.findByIdAndUpdate(cityId, { ...validatedBody });
            let reports = {
                "action":"Update City",
                "type":"CITIES",
                "deepId":cityId,
                "user": req.user._id
            };
            await Report.create({...reports});
            await City.findById(cityId).then( e => {
                let city ={
                    name:lang=="ar"?e.name_ar:e.name_en,
                    name_ar:e.name_ar,
                    name_en:e.name_en,
                    country:e.country,
                    img:e.img,
                    id: e._id,
                    createdAt: e.createdAt,
                }
                res.send({
                    success:true,
                    data:city
                });
            })
        } catch (error) {
            next(error);
        }
    },
    //get without pagenation
    async getAll(req, res, next) {
        try {
            convertLang(req)
             //get lang
            let lang = i18n.getLocale(req)
            let {name} = req.query;

            let query = {deleted: false,country:req.params.country }
             /*search by name */
            if(name) {
                query = {
                    $and: [
                        { $or: [
                            {name_ar: { $regex: '.*' + name + '.*' , '$options' : 'i'  }}, 
                            {name_en: { $regex: '.*' + name + '.*', '$options' : 'i'  }}, 
                          
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            await City.find(query)
                .sort({ _id: 1 })
                .then( async(data) => {
                    var newdata = [];
                    await Promise.all(data.map(async(e) =>{
                        let index = {
                            name:lang=="ar"?e.name_ar:e.name_en,
                            name_ar:e.name_ar,
                            name_en:e.name_en,
                            description:lang=="ar"?e.description_ar:e.description_en,
                            description_ar:e.description_ar,
                            description_en:e.description_en,
    
                            country:e.country,
                            img:e.img,
                            id: e._id,
                            createdAt: e.createdAt,
                        }
                        newdata.push(index)
                    }))
                    res.send({
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
             //get lang
            let lang = i18n.getLocale(req)
            let {name} = req.query
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let query = {  deleted: false,country:req.params.country }
            /*search by name */
            if(name) {
                query = {
                    $and: [
                        { $or: [
                            {name_ar: { $regex: '.*' + name + '.*' , '$options' : 'i'  }}, 
                            {name_en: { $regex: '.*' + name + '.*', '$options' : 'i'  }}, 
                          
                          ] 
                        },
                        {deleted: false},
                    ]
                };
            }
            await City.find(query)
                .sort({ _id: 1 })
                .limit(limit)
                .skip((page - 1) * limit)
                .then(async (data) => {
                    var newdata = [];
                    await Promise.all(data.map(async(e) =>{
                        let index = {
                            name:lang=="ar"?e.name_ar:e.name_en,
                            name_ar:e.name_ar,
                            name_en:e.name_en,
                            description:lang=="ar"?e.description_ar:e.description_en,
                            description_ar:e.description_ar,
                            description_en:e.description_en,
    
                            country:e.country,
                            img:e.img,
                            id: e._id,
                            createdAt: e.createdAt,
                        }
                        newdata.push(index)
                    }))
                    const count = await City.countDocuments(query);
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
            let { cityId } = req.params;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let city = await checkExistThenGet(cityId, City);
            city.deleted = true;
            await city.save();
            let reports = {
                "action":"Delete City",
                "type":"CITIES",
                "deepId":cityId,
                "user": req.user._id
            };
            await Report.create({...reports});
            res.send({
                success:true
            });
        } catch (err) {
            next(err);
        }
    },

   

}