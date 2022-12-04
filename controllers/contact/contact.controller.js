import { body } from "express-validator/check";
import Contact from "../../models/contact/contact.model";
import User from "../../models/user/user.model";
import { checkExist, checkExistThenGet,isInArray } from "../../helpers/CheckMethods";
import ApiError from "../../helpers/ApiError";
import ApiResponse from "../../helpers/ApiResponse";
import { checkValidations,convertLang } from "../shared/shared.controller";
import { sendEmail } from "../../services/emailMessage.service";
import i18n from "i18n";

export default {
    validateContactCreateBody() {
        return [
            body('name').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('name.required', { value});
            }),
            body('email').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('email.required', { value});
            })
            .isEmail().withMessage((value, { req}) => {
                return req.__('email.syntax', { value});
            }),
            body('message').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('message.required', { value});
            }),
        ]
    },
    async createContactMessage(req, res, next) {
        try {
            const validatedBody = checkValidations(req);
            await Contact.create({ ...validatedBody });
            res.status(200).send({success:true});
        } catch (error) {
            next(error);
        }
    },
    async findAll(req, res, next) {
        try {
            convertLang(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20, query = { deleted: false };

            await checkExist(req.user._id, User);
            let contacts = await Contact.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit);


            const contactsCount = await Contact.countDocuments(query);
            const pageCount = Math.ceil(contactsCount / limit);

            res.send(new ApiResponse(contacts, page, pageCount, limit, contactsCount, req));
        } catch (err) {
            next(err);
        }
    },
    async findById(req, res, next) {
        try {
            convertLang(req)
            let { contactId } = req.params;
            res.send({success:true,data:await checkExistThenGet(contactId, Contact)});
        } catch (err) {
            next(err);
        }
    },
    validateContactReplyBody() {
        let validation = [
            body('reply').not().isEmpty().withMessage((value, { req}) => {
                return req.__('reply.required', { value});
            }),
        ]
        return validation;
    },
    async reply(req, res, next) {
        try {
            convertLang(req)
            let { contactId } = req.params;
            const validatedBody = checkValidations(req);
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let contact = await checkExistThenGet(contactId, Contact);
            contact.reply = true;
            contact.replyText = validatedBody.reply;
            await contact.save();
            let description = 'manQol Reply on your message';
            sendEmail(contact.email, validatedBody.reply,description)

            res.status(200).send({success:true});
        } catch (err) {
            next(err);
        }
    },
    async delete(req, res, next) {
        try {
            let { contactId } = req.params;
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let contact = await checkExistThenGet(contactId, Contact);
            contact.deleted = true;
            await contact.save();
            res.status(200).send({success:true});
        } catch (err) {
            next(err);
        }
    },
};