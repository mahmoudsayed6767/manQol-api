import Service from "../../models/service/service.model";
import { body } from "express-validator/check";
import { checkValidations ,convertLang} from "../shared/shared.controller";
import ApiError from "../../helpers/ApiError";
import { checkExist,isInArray } from "../../helpers/CheckMethods";
import ApiResponse from "../../helpers/ApiResponse";
import { checkExistThenGet } from "../../helpers/CheckMethods";
import i18n from "i18n";
import Report from "../../models/reports/report.model";
export default {
    validateServiceBody() {
        return [
            body('name_ar').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('name_ar.required', { value});
            }),
            body('name_en').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('name_en.required', { value});
            }),
        ];
    },
    async create(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            
            const validatedBody = checkValidations(req);
            let service = await Service.create({ ...validatedBody });
            let reports = {
                "action":"Create service",
                "type":"SERVICE",
                "deepId":service.id,
                "user": req.user._id
            };
            await Report.create({...reports });
            return res.status(201).send({success: true});
        } catch (error) {
            next(error);
        }
    },
    async getById(req, res, next) {
        try {
            convertLang(req)
            //get the language selected
            let lang = i18n.getLocale(req)
            let { serviceId } = req.params;
            
            await checkExist(serviceId, Service, { deleted: false });
            await Service.findById(serviceId).then( e => {
                let service = {
                    service:lang=="ar"?e.name_ar:e.name_en,
                    name_ar:e.name_ar,
                    name_en:e.name_en,
                    id: e._id,
                    createdAt: e.createdAt,
                }
                return res.send({success: true,data:service});
            })
        } catch (error) {
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            convertLang(req)
            let { serviceId } = req.params;

            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            const validatedBody = checkValidations(req);
            let reports = {
                "action":"Update service",
                "type":"SERVICE",
                "deepId":serviceId,
                "user": req.user._id
            };
            await Report.create({...reports });

            await Service.findByIdAndUpdate(serviceId, { ...validatedBody });
            return res.status(200).send({success: true});
        } catch (error) {
            next(error);
        }
    },

    async getAll(req, res, next) {
        try {
            convertLang(req)
            //get the language selected
            let lang = i18n.getLocale(req)
            let query = { deleted: false }
            await Service.find(query)
                .then( data => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push({
                            service:lang=="ar"?e.name_ar:e.name_en,
                            name_ar:e.name_ar,
                            name_en:e.name_en,
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
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let query = { deleted: false }
            await Service.find(query)
                .sort({ _id: -1 })
                .limit(limit)
                .skip((page - 1) * limit)
                .then(async (data) => {
                    var newdata = [];
                    data.map(async(e) =>{
                        newdata.push({
                            name:lang=="ar"?e.name_ar:e.name_en,
                            name_en:e.name_en,
                            availableService:e.availableService,
                            name_ar:e.name_ar,
                            id: e._id,
                            createdAt: e.createdAt,
                        });
                    })
                    const count = await Service.countDocuments(query);
                    const pageCount = Math.ceil(count / limit);

                    res.send(new ApiResponse(newdata, page, pageCount, limit, count, req));
                })

            } catch (error) {
            next(error);
        } 
    }, 
   


    async delete(req, res, next) {
        let { serviceId } = req.params;
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let service = await checkExistThenGet(serviceId, Service);
            service.deleted = true;
            await service.save();
            let reports = {
                "action":"Delete service",
                "type":"SERVICE",
                "deepId":serviceId,
                "user": req.user._id
            };
            await Report.create({...reports});

            res.send({success: true});

        } catch (err) {
            next(err);
        }
    },


}