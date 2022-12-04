import Country from "../../models/country/country.model";

import ApiError from "../../helpers/ApiError";
import ApiResponse from "../../helpers/ApiResponse";
import { body } from "express-validator/check";
import { checkExistThenGet ,isInArray,checkExist} from "../../helpers/CheckMethods";
import { handleImg, checkValidations,convertLang } from "../shared/shared.controller";
import i18n from "i18n";
import Report from "../../models/reports/report.model";

export default {
    /*validate body data */
    validateCountryBody(isUpdate = false) {
        let validations = [
            body('name_en').not().isEmpty().withMessage((value, { req}) => {
                return req.__('name_en.required', { value});
            }) .custom(async (value, { req }) => {
                let userQuery = { name_en: value, deleted: false };
                if (isUpdate)
                    userQuery._id = { $ne: req.params.countryId };
                if (await Country.findOne(userQuery))
                    throw req.__('country.duplicated');
                else
                    return true;
            }),
            body('name_ar').not().isEmpty().withMessage((value, { req}) => {
                return req.__('name_ar.required', { value});
            }).custom(async (value, { req }) => {
                let userQuery = { name_ar: value, deleted: false };
                if (isUpdate)
                    userQuery._id = { $ne: req.params.countryId };
                if (await Country.findOne(userQuery)){
                    throw req.__('country.duplicated')
                }
                else
                    return true;
            }),
            body('countryCode').not().isEmpty().withMessage((value, { req}) => {
                return req.__('countryCode.required', { value});
            }),
            body('isoCode').not().isEmpty().withMessage((value, { req}) => {
                return req.__('isoCode.required', { value});
            }),
            body('numbersCount').not().isEmpty().withMessage((value, { req}) => {
                return req.__('numbersCount.required', { value});
            }),
            body('hint').not().isEmpty().withMessage((value, { req}) => {
                return req.__('hint.required', { value});
            })
        ];
        if (isUpdate)
        validations.push([
            body('img').optional().custom(val => isImgUrl(val)).withMessage((value, { req}) => {
                return req.__('img.syntax', { value});
            })
        ]);
        return validations;
    },
    /*create new country */
    async create(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));

            const validatedBody = checkValidations(req);
            let image = await handleImg(req);
            let country = await Country.create({ ...validatedBody,img:image });
            let reports = {
                "action":"Create New Country",
                "type":"COUNTRIES",
                "deepId":country.id,
                "user": req.user._id
            };
            await Report.create({...reports });
            await Country.findById(country.id).then( e => {
                let country = {
                    name:lang=="ar"?e.name_ar:e.name_en,
                    name_en:e.name_en,
                    name_ar:e.name_ar,
                    countryCode:e.countryCode,
                    isoCode:e.isoCode,
                    numbersCount:e.numbersCount,
                    hint:e.hint,
                    img:e.img,
                    id: e._id,
                    createdAt: e.createdAt,
                }
                return res.status(201).send({
                    success:true,
                    data:country,
                });
            })
        } catch (error) {
            next(error);
        }
    },
    /*get all data without pagenation */
    async getAll(req, res, next) {
        try {
            //get lang
            let lang = i18n.getLocale(req)
            let {search} = req.query;
            let query = { deleted: false }
            if(search) {
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
            
            await Country.find(query)
                .sort({ _id: -1 })
                .then( data => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push({
                            name:lang=="ar"?e.name_ar:e.name_en,
                            name_en:e.name_en,
                            name_ar:e.name_ar,
                            countryCode:e.countryCode,
                            isoCode:e.isoCode,
                            numbersCount:e.numbersCount,
                            hint:e.hint,
                            img:e.img,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    res.send({
                        success:true,
                        data:newdata
                    });
                })
        } catch (error) {
            next(error);
        }
    },
    /*get all data with pagenation */
    async getAllPaginated(req, res, next) {
        try {
            //get lang
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20,
            {search} = req.query;
            let query = { deleted: false }
            /*search by name */
            if(search) {
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
            await Country.find(query)
                .sort({ _id: -1 })
                .limit(limit)
                .skip((page - 1) * limit)
                .then(async (data) => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push({
                            name:lang=="ar"?e.name_ar:e.name_en,
                            name_en:e.name_en,
                            name_ar:e.name_ar,
                            countryCode:e.countryCode,
                            isoCode:e.isoCode,
                            numbersCount:e.numbersCount,
                            hint:e.hint,
                            img:e.img,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    const count = await Country.countDocuments(query);
                    const pageCount = Math.ceil(count / limit);

                    res.send(new ApiResponse(newdata, page, pageCount, limit, count, req));
                })
        } catch (error) {
            next(error);
        } 
    }, 
    /*update record */
    async update(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let { countryId } = req.params;

            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));

            const validatedBody = checkValidations(req);
            if (req.file) {
                let image = await handleImg(req, { attributeName: 'img', isUpdate: true });
                validatedBody.img = image;
            }
            await Country.findByIdAndUpdate(countryId, {
                ...validatedBody,
            }, { new: true });
            let reports = {
                "action":"Update Country",
                "type":"COUNTRIES",
                "deepId":countryId,
                "user": req.user._id
            };
            await Report.create({...reports });
            await Country.findById(countryId).then( e => {
                let country = {
                    name:lang=="ar"?e.name_ar:e.name_en,
                    name_en:e.name_en,
                    name_ar:e.name_ar,
                    countryCode:e.countryCode,
                    isoCode:e.isoCode,
                    numbersCount:e.numbersCount,
                    hint:e.hint,
                    img:e.img,
                    id: e._id,
                    createdAt: e.createdAt,
                }
                return res.send({
                    success:true,
                    data:country,
                });
            })
        } catch (error) {
            next(error);
        }
    },
    /*get by id */
    async getById(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let { countryId } = req.params;
            await checkExist(countryId, Country, { deleted: false });
            await Country.findById(countryId).then( e => {
                let country = {
                    name:lang=="ar"?e.name_ar:e.name_en,
                    name_en:e.name_en,
                    name_ar:e.name_ar,
                    countryCode:e.countryCode,
                    isoCode:e.isoCode,
                    numbersCount:e.numbersCount,
                    hint:e.hint,
                    img:e.img,
                    id: e._id,
                    createdAt: e.createdAt,
                }
                return res.send({
                    success:true,
                    data:country,
                });
            })
        } catch (error) {
            next(error);
        }
    },
    /*delete country */
    async delete(req, res, next) {
        let { countryId } = req.params;
        try {
            convertLang(req)
            let country = await checkExistThenGet(countryId, Country, { deleted: false });
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            
            country.deleted = true;
            await country.save();
            let reports = {
                "action":"Delete Country",
                "type":"COUNTRIES",
                "deepId":countryId,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.send({success:true});

        } catch (err) {
            next(err);
        }
    }
}