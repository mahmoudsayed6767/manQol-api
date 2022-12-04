import ApiResponse from "../../helpers/ApiResponse";
import Setting from "../../models/setting/setting.model";
import Report from "../../models/reports/report.model";
import ApiError from '../../helpers/ApiError';

import { checkExist, checkExistThenGet,isInArray } from "../../helpers/CheckMethods";
import { checkValidations,convertLang } from "../shared/shared.controller";
import { body } from "express-validator/check";
import i18n from "i18n";

export default {

    async findAll(req, res, next) {

        try {
            convertLang(req)
            let query = {deleted: false };
            let setting = await Setting.findOne(query).sort({ createdAt: -1 })
            res.send({success: true,setting:setting});
        } catch (err) {
            next(err);
        }
    },

    validateBody(isUpdate = false) {
        let validations = [
            body('androidAppVersion').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('androidAppVersion.required', { value});
            }),
            body('iosAppVersion').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('iosAppVersion.required', { value});
            }),
            body('tax').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('tax.required', { value});
            }),
           
        ];
        return validations;
    },

    async create(req, res, next) {

        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
    
            const validatedBody = checkValidations(req);
            let createdSetting = await Setting.create({ ...validatedBody});
            let reports = {
                "action":"Create Settings",
                "type":"SETTINGS",
                "deepId":createdSetting.id,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.status(201).send({success:true});
        } catch (err) {
            next(err);
        }
    },


    async findById(req, res, next) {
        try {
            convertLang(req)
            let { SettingId } = req.params;
            await checkExist(SettingId, Setting, { deleted: false });
            let setting = await Setting.findById(SettingId);
            res.send({success:true,setting:setting});
        } catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {

        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));

            let { SettingId } = req.params;
            await checkExist(SettingId, Setting, { deleted: false });

            const validatedBody = checkValidations(req);
            await Setting.findByIdAndUpdate(SettingId, {
                ...validatedBody,
            }, { new: true });
            let reports = {
                "action":"Update Setting",
                "type":"SETTINGS",
                "deepId":SettingId,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.status(200).send({success:true});
        }
        catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
                
            let { SettingId } = req.params;
            let setting = await checkExistThenGet(SettingId, Setting, { deleted: false });
            setting.deleted = true;
            await setting.save();
            let reports = {
                "action":"Delete Setting",
                "type":"SETTINGS",
                "deepId":SettingId,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.status(200).send({success:true});

        }
        catch (err) {
            next(err);
        }
    },

  
};