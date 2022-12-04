import ApiResponse from "../../helpers/ApiResponse";
import About from "../../models/about/about.model";
import Report from "../../models/reports/report.model";
import ApiError from '../../helpers/ApiError';
import { checkExist, checkExistThenGet, isImgUrl,isInArray ,isLat,isLng} from "../../helpers/CheckMethods";
import { handleImg, checkValidations,convertLang } from "../shared/shared.controller";
import { body } from "express-validator/check";
import i18n from "i18n";
import { ValidationError } from "mongoose";

//validate location
function validatedLocation(location) {
    if (!isLng(location[0]))
        throw new ValidationError.UnprocessableEntity({ keyword: 'location', message: i18n.__("lng.validate") });
    if (!isLat(location[1]))
        throw new ValidationError.UnprocessableEntity({ keyword: 'location', message: i18n.__("lat.validate") });
}
export default {

    async findAll(req, res, next) {

        try {
            convertLang(req)
            let lang = i18n.getLocale(req) 
            let query = {deleted: false };
            await About.find(query)
            .then( async(data) => {
                var newdata = [];
                data.map(async(e) =>{
                    let index ={
                        aboutUs:lang=="ar"?e.aboutUs_ar:e.aboutUs_en,
                        aboutUs_ar:e.aboutUs_ar,
                        aboutUs_en:e.aboutUs_en,
                        address:lang=="ar"?e.address_ar:e.address_en,
                        address_ar:e.address_ar,
                        address_en:e.address_en,
                        phone:e.phone,
                        email:e.email,
                        location:e.location,
                        logo:e.logo,
                        id: e._id,
                        createdAt: e.createdAt,
                    }
                    await newdata.push(index)
                })
                res.send({
                    success:true,
                    data:newdata[0]
                });
            })

        } catch (err) {
            next(err);
        }
    },

    validateBody(isUpdate = false) {
        let validations = [
            body('aboutUs_ar').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('aboutUs_ar.required', { value});
            }),
            body('aboutUs_en').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('aboutUs_en.required', { value});
            }),
            body('phone').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('phone.required', { value});
            }),
            body('address_ar').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('address_ar.required', { value});
            }),
            body('address_en').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('address_en.required', { value});
            }),
            body('location').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('location.required', { value});
            }),
            body('email').not().isEmpty().withMessage((value, { req}) => {
                return req.__('email.required', { value});
            }).isEmail().withMessage('email.syntax')
        ];
        if (isUpdate)
        validations.push([
            body('logo').optional().custom(val => isImgUrl(val)).withMessage('logo should be a valid img')
        ]);
        
        return validations;
    },

    async create(req, res, next) {

        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
    
            const validatedBody = checkValidations(req);
            console.log(validatedBody)
            validatedLocation(validatedBody.location);
            validatedBody.location = { type: 'Point', coordinates: [+req.body.location[0], +req.body.location[1]] };
            
            let image = await handleImg(req);
            validatedBody.logo = image
            
            let theAbout = await About.create({ ...validatedBody});

            let reports = {
                "action":"Create About Us",
                "type":"ABOUT",
                "deepId":theAbout.id,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.status(201).send({success:true,data:theAbout});
        } catch (err) {
            next(err);
        }
    },

    async update(req, res, next) {

        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let { aboutId } = req.params;
            await checkExist(aboutId, About, { deleted: false });
            const validatedBody = checkValidations(req);
            validatedLocation(validatedBody.location);
            validatedBody.location = { type: 'Point', coordinates: [+req.body.location[0], +req.body.location[1]] };
            
            if(req.file){
                let image = await handleImg(req);
                console.log(image)
                validatedBody.logo = image
            }
            await About.findByIdAndUpdate(aboutId, {
                ...validatedBody,
            }, { new: true });
            let reports = {
                "action":"Update About Us",
                "type":"ABOUT",
                "deepId":aboutId,
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
                return next(new ApiError(403,i18n.__('admin.auth')));
                
            let { aboutId } = req.params;
            let about = await checkExistThenGet(aboutId, About, { deleted: false });
            about.deleted = true;
            await about.save();
            let reports = {
                "action":"Delete About Us",
                "type":"ABOUT",
                "deepId":aboutId,
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