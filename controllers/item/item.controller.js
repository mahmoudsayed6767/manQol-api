import Item from "../../models/item/item.model";
import { body } from "express-validator/check";
import { checkValidations ,convertLang} from "../shared/shared.controller";
import ApiError from "../../helpers/ApiError";
import { checkExist,isInArray } from "../../helpers/CheckMethods";
import ApiResponse from "../../helpers/ApiResponse";
import { checkExistThenGet } from "../../helpers/CheckMethods";
import i18n from "i18n";
import Report from "../../models/reports/report.model";
const populateQuery = [
    { path: 'availableServices', model: 'service'},
];
export default {
    validateItemBody() {
        return [
            body('name_ar').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('name_ar.required', { value});
            }),
            body('name_en').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('name_en.required', { value});
            }),
            body('availableServices').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('availableServices.required', { value});
            }),
        ];
    },
    async create(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            
            const validatedBody = checkValidations(req);
            let item = await Item.create({ ...validatedBody });
            let reports = {
                "action":"Create item",
                "type":"ITEM",
                "deepId":item.id,
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
            let { itemId } = req.params;
            
            await checkExist(itemId, Item, { deleted: false });
            await Item.findById(itemId).populate(populateQuery)
            .then( e => {
                let index = {
                    item:lang=="ar"?e.name_ar:e.name_en,
                    name_ar:e.name_ar,
                    name_en:e.name_en,
                    id: e._id,
                    createdAt: e.createdAt,
                }
                let availableServices = [];
                for (let v of e.availableServices) {
                    availableServices.push({
                        name:lang=="ar"?v.name_ar:v.name_en,
                        id:v._id
                    })
                }
                index.availableServices = availableServices
                newdata.push(index);
                return res.send({success: true,data:index});
            })
        } catch (error) {
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            convertLang(req)
            let { itemId } = req.params;

            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            const validatedBody = checkValidations(req);
            let reports = {
                "action":"Update item",
                "type":"ITEM",
                "deepId":itemId,
                "user": req.user._id
            };
            await Report.create({...reports });

            await Item.findByIdAndUpdate(itemId, { ...validatedBody });
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
            await Item.find(query).populate(populateQuery)
                .then( async (data) => {
                    var newdata = [];
                    await Promise.all(data.map(async(e) =>{
                        let index = {
                            item:lang=="ar"?e.name_ar:e.name_en,
                            name_ar:e.name_ar,
                            name_en:e.name_en,
                            id: e._id,
                            createdAt: e.createdAt,
                        }
                        let availableServices = [];
                        for (let v of e.availableServices) {
                            availableServices.push({
                                name:lang=="ar"?v.name_ar:v.name_en,
                                id:v._id
                            })
                        }
                        index.availableServices = availableServices
                        newdata.push(index);

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
    /*get all data with pagenation */
    async getAllPaginated(req, res, next) {
        try {
            //get lang
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20;
            let query = { deleted: false }
            await Item.find(query).populate(populateQuery)
                .sort({ _id: -1 })
                .limit(limit)
                .skip((page - 1) * limit)
                .then(async (data) => {
                    var newdata = [];
                    await Promise.all(data.map(async(e) =>{
                        let index = {
                            item:lang=="ar"?e.name_ar:e.name_en,
                            name_ar:e.name_ar,
                            name_en:e.name_en,
                            id: e._id,
                            createdAt: e.createdAt,
                        }
                        let availableServices = [];
                        for (let v of e.availableServices) {
                            availableServices.push({
                                name:lang=="ar"?v.name_ar:v.name_en,
                                id:v._id
                            })
                        }
                        index.availableServices = availableServices
                        newdata.push(index);

                    }))
                    const count = await Item.countDocuments(query);
                    const pageCount = Math.ceil(count / limit);

                    res.send(new ApiResponse(newdata, page, pageCount, limit, count, req));
                })

            } catch (error) {
            next(error);
        } 
    }, 
   


    async delete(req, res, next) {
        let { itemId } = req.params;
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let item = await checkExistThenGet(itemId, Item);
            item.deleted = true;
            await item.save();
            let reports = {
                "action":"Delete item",
                "type":"ITEM",
                "deepId":itemId,
                "user": req.user._id
            };
            await Report.create({...reports});

            res.send({success: true});

        } catch (err) {
            next(err);
        }
    },


}