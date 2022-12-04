import { checkExistThenGet, checkExist ,isInArray,isLng, isLat} from '../../helpers/CheckMethods';
import { body } from 'express-validator/check';
import { checkValidations, handleImg,convertLang } from '../shared/shared.controller';
import { generateToken } from '../../utils/token';
import ApiResponse from "../../helpers/ApiResponse";
import User from "../../models/user/user.model";
import Report from "../../models/reports/report.model";
import ApiError from '../../helpers/ApiError';
import bcrypt from 'bcryptjs';
import { toImgUrl } from "../../utils";
import City from "../../models/city/city.model";
import { generateVerifyCode } from '../../services/generator-code-service';
import DeviceDetector from "device-detector-js";
import { sendEmail } from "../../services/sendGrid";
import Address from "../../models/address/address.model"
import {transformAddress } from '../../models/address/transformAddress';

import {sendSms} from "../../services/sms"
import { sendNotifiAndPushNotifi } from "../../services/notification-service";
import i18n from "i18n";
import {transformUser,transformUserById } from '../../models/user/transformUser';
import Country from "../../models/country/country.model";
function validateDestination(location) {
    if (!isLng(location[0]))
        throw new Error(i18n.__('invalid.lng'));
    if (!isLat(location[1]))
    throw new Error(i18n.__('invalid.lat'));
}
const checkUserExistByPhone = async (phone) => {
    let user = await User.findOne({ phone:phone,deleted:false });
    if (!user)
        throw new ApiError.BadRequest('Phone Not Found');

    return user;
}
const populateQuery = [
    { path: 'country', model: 'country' },
    { path: 'city' , model: 'city'}
];
const populateQuery2 = [
    { path: 'city' , model: 'city'}
];
export default {
    async signIn(req, res, next) {
        try{
            convertLang(req)
            let lang = i18n.getLocale(req)
            let user = req.user;
            user = await User.findById(user.id).populate(populateQuery);
           
            if(!user)
                return next(new ApiError(403, ('phone or password incorrect')));
            
            if(user.block == true){
                return next(new ApiError(500, (i18n.__('user.block'))));
            }
            if(user.deleted == true){
                return next(new ApiError(500, (i18n.__('user.delete'))));
            }

            if(req.body.token != null && req.body.token !=""){
                let arr2 = user.tokens; 
                if(!req.body.osType || req.body.osType == ""){
                    const deviceDetector = new DeviceDetector();
                    
                    if(deviceDetector.parse(req.headers['user-agent']).os){
                        let osType = deviceDetector.parse(req.headers['user-agent']).os.name
                        if(isInArray(["Mac","iOS"],osType)){
                            req.body.osType = "IOS"
                        }else{
                            req.body.osType = "ANDROID"
                        }
                    }else{
                        req.body.osType = "WEB"
                    }
                    
                }
                var found2 = arr2.find(x => x.token == req.body.token)
                
                if(!found2){
                    let theToken = {
                        token: req.body.token,
                        osType:req.body.osType
                    }
                    user.tokens.push(theToken);
                    await user.save();
                }
            }
            await User.findById(user.id).populate(populateQuery)
            .then(async(e)=>{
                let index = await transformUserById(e,lang)
                if(user.type === "DRIVER"){
                    if(user.verify == false){
                        res.status(200).send({
                            success:true,
                            data:index,
                        });
                    }else{
                        res.status(200).send({
                            success:true,
                            data:index,
                            token:generateToken(user.id)
                        });
                    }
                    
                }else{
                    res.status(200).send({
                        success:true,
                        data:index,
                        token:generateToken(user.id)
                    });
                }
            })
        } catch(err){
            next(err);
        }
    },
    validateSignUpBody(isUpdate = false) {////
        let validations = [
            body('firstname').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('firstname.required', { value});
            }),
            body('lastname').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('lastname.required', { value});
            }),
            body('country').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('country.required', { value});
            }).isNumeric().withMessage((value, { req}) => {
                return req.__('country.numeric', { value});
            }).custom(async (value, { req }) => {
                if (!await Country.findOne({_id:value,deleted:false}))
                    throw new Error(req.__('country.invalid'));
                else
                    return true;
            }),
            body('city').trim().optional().isNumeric().withMessage((value, { req}) => {
                return req.__('city.numeric', { value});
            }).custom(async (value, { req }) => {
                if (!await City.findOne({_id:value,deleted:false}))
                    throw new Error(req.__('city.invalid'));
                else
                    return true;
            }),
            body('type').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('type.required', { value});
            }).isIn(['DRIVER','ADMIN','USER','SUB-ADMIN']).withMessage((value, { req}) => {
                    return req.__('type.invalid', { value});
            }),
            body('phone').trim().not().isEmpty().withMessage((value, { req}) => {
                return req.__('phone.required', { value});
            })
            .custom(async (value, { req }) => {
                var exp = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[s/./0-9]*$/g
                if(!exp.test(value)){
                    throw new Error(req.__('phone.syntax'));
                }
                let userQuery = { phone: value,deleted:false };
                if (isUpdate && req.user.phone === value)
                    userQuery._id = { $ne: req.user._id };

                if (await User.findOne(userQuery))
                    throw new Error(req.__('phone.duplicated'));
                else
                    return true;
                
            }),
            body('email').trim().isEmail().withMessage('email.syntax').
            custom(async (value, { req }) => {
                let userQuery = { email: value,deleted:false };
                if (isUpdate && req.user.email === value)
                    userQuery._id = { $ne: req.user._id };

                if (await User.findOne(userQuery))
                    throw new Error(req.__('email.duplicated'));
                else
                    return true;
                
            }),
            body('password').not().isEmpty().withMessage((value, { req}) => {
                return req.__('password.required', { value});
            }).isLength({ min: 8 }).withMessage((value, { req}) => {
                return req.__('password.invalid', { value});
            }).custom(async (value, { req }) => {
                var exp = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
                //"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$""
                if(!exp.test(value)){
                    throw new Error(req.__('password.invalid'));
                }
                else
                    return true;
                
            }),
            body('carNumber').trim().optional()
            .custom(async (value, { req }) => {
                //"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$""
                if(!value && req.body.type =="DRIVER") {
                    throw new Error(req.__('carNumber.required'));
                }
                else
                    return true;
                
            }),
        ];
        return validations;
    },
    async signUp(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            const validatedBody = checkValidations(req);
            if (req.files['img']) {
                let imagesList = [];
                for (let imges of req.files['img']) {
                    imagesList.push(await toImgUrl(imges))
                }
                validatedBody.img = imagesList[0];
            }
            if (req.files['carLicense']) {
                let imagesList = [];
                for (let imges of req.files['carLicense']) {
                    imagesList.push(await toImgUrl(imges))
                }
                validatedBody.carLicense = imagesList;
            }else{
                if(validatedBody.type == "DRIVER")
                    return next(new ApiError(422, i18n.__('carLicense.required'))); 
            }
            if (req.files['driverLicense']) {
                let imagesList = [];
                for (let imges of req.files['driverLicense']) {
                    imagesList.push(await toImgUrl(imges))
                }
                validatedBody.driverLicense = imagesList;
            }else{
                if(validatedBody.type == "DRIVER")
                    return next(new ApiError(422, i18n.__('driverLicense.required'))); 
            }
            let createdUser = await User.create({
                ...validatedBody
            });
            //send code
            let theUser = await checkExistThenGet(createdUser.id, User,{deleted: false });
            if(validatedBody.token != null && validatedBody.token !=""){
                let arr2 = theUser.tokens; 
                if(!validatedBody.osType || validatedBody.osType == ""){
                    const deviceDetector = new DeviceDetector();
                    if(deviceDetector.parse(req.headers['user-agent']).os){
                        let osType = deviceDetector.parse(req.headers['user-agent']).os.name
                        if(isInArray(["Mac","iOS"],osType)){
                            validatedBody.osType = "IOS"
                        }else{
                            validatedBody.osType = "ANDROID"
                        }
                    }else{
                        validatedBody.osType = "WEB"
                    }
                }
                var found2 = arr2.find(x => x.token == validatedBody.token)
                
                if(!found2){
                    let theToken = {
                        token: validatedBody.token,
                        osType:validatedBody.osType
                    }
                    theUser.tokens.push(theToken);
                }
            }
            await theUser.save();
            let reports = {
                "action":"User sign Up ",
                "type":"USERS",
                "deepId":createdUser.id,
                "user": createdUser._id
            };
            await Report.create({...reports });
            await User.findById(createdUser.id).populate(populateQuery)
            .then(async(e)=>{
                let index = await transformUserById(e,lang)
                if(validatedBody.type ==="DRIVER"){
                    res.status(201).send({
                        success:true,
                        data:index
                    });
                }else{
                    res.status(201).send({
                        success:true,
                        data:index,
                        token:generateToken(createdUser.id)
                    });
                }
            })
        } catch (err) {
            next(err);
        }
    },
    async addUser(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            const validatedBody = checkValidations(req);
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 
            if (req.files['img']) {
                let imagesList = [];
                for (let imges of req.files['img']) {
                    imagesList.push(await toImgUrl(imges))
                }
                validatedBody.img = imagesList[0];
            }
            if (req.files['carLicense']) {
                let imagesList = [];
                for (let imges of req.files['carLicense']) {
                    imagesList.push(await toImgUrl(imges))
                }
                validatedBody.carLicense = imagesList;
            }else{
                if(validatedBody.type == "DRIVER")
                    return next(new ApiError(422, i18n.__('carLicense.required'))); 
            }
            if (req.files['driverLicense']) {
                let imagesList = [];
                for (let imges of req.files['driverLicense']) {
                    imagesList.push(await toImgUrl(imges))
                }
                validatedBody.driverLicense = imagesList;
            }else{
                if(validatedBody.type == "DRIVER")
                    return next(new ApiError(422, i18n.__('driverLicense.required'))); 
            }
            validatedBody.verify = true;
            let createdUser = await User.create({
                ...validatedBody
            });
            let reports = {
                "action":"Add User",
                "type":"USERS",
                "deepId":createdUser.id,
                "user": req.user._id
            };
            await Report.create({...reports });
            await User.findById(createdUser.id).populate(populateQuery)
            .then(async(e)=>{
                let index = await transformUserById(e,lang)
                res.status(201).send({
                    success:true,
                    data:index,
                });
            })
        } catch (err) {
            next(err);
        }
    },
    async block(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 

            let { userId} = req.params;
            let user = await checkExistThenGet(userId,User);
            user.block = true;
            await user.save();
            sendNotifiAndPushNotifi({
                targetUser: userId, 
                fromUser: user._id, 
                text: 'manQol ',
                subject: userId,
                subjectType: 'logout',
                info:'LOGOUT',
                content_available:true
            });
            let reports = {
                "action":"Block User",
                "type":"USERS",
                "deepId":userId,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.send({success: true});
        } catch (error) {
            next(error);
        }
    },
    async unblock(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 

            let { userId} = req.params;
            let user = await checkExistThenGet(userId,User);
            user.block = false;
            await user.save();
            let reports = {
                "action":"remove Block User",
                "type":"USERS",
                "deepId":userId,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.send({success: true});
        } catch (error) {
            next(error);
        }
    },
    async verify(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 

            let { userId} = req.params;
            let user = await checkExistThenGet(userId,User);
            user.verify = true;
            await user.save();
            sendNotifiAndPushNotifi({
                targetUser: userId, 
                fromUser: user._id, 
                text: 'manQol ',
                subject: userId,
                subjectType: 'you are verified',
                info:'USER',
            });
            let reports = {
                "action":"verify User",
                "type":"USERS",
                "deepId":userId,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.send({success: true});
        } catch (error) {
            next(error);
        }
    },
    async unVerify(req, res, next) {
        try {
            convertLang(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 

            let { userId} = req.params;
            let user = await checkExistThenGet(userId,User);
            user.verify = false;
            await user.save();
            let reports = {
                "action":"remove verify User",
                "type":"USERS",
                "deepId":userId,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.send({success: true});
        } catch (error) {
            next(error);
        }
    },
    validateUpdatedPassword(isUpdate = false) {
        let validation = [
            body('newPassword').not().isEmpty().withMessage((value, { req}) => {
                return req.__('newPassword.required', { value});
            }).isLength({ min: 6 }).withMessage((value, { req}) => {
                return req.__('newPassword.invalid', { value});
            }),
            body('currentPassword').not().isEmpty().withMessage((value, { req}) => {
                return req.__('currentPassword.required', { value});
            }).isLength({ min: 6 }).withMessage((value, { req}) => {
                return req.__('currentPassword.invalid', { value});
            }),
           
        ];

        return validation;
    },
    async updatePassword(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let user = await checkExistThenGet(req.user._id, User);
            if (req.body.newPassword) {
                if (req.body.currentPassword) {
                    if (bcrypt.compareSync(req.body.currentPassword, user.password)) {
                        user.password = req.body.newPassword;
                    }
                    else {
                        res.status(400).send({
                            errors: [
                                {
                                    location: 'body',
                                    param: 'currentPassword',
                                    msg: i18n.__('currentPassword.invalid')
                                }
                            ]
                        });
                    }
                }
            }
            await user.save();
            await User.findById(req.user._id).populate(populateQuery)
            .then(async(e)=>{
                let index = await transformUserById(e,lang)
                res.send({
                    success:true,
                    data:index,
                    token:generateToken(req.user._id)
                });
            })

        } catch (error) {
            next(error);
        }
    },
    validateForgetPassword() {
        return [
            body('phone').not().isEmpty().withMessage((value, { req}) => {
                return req.__('phone.required', { value});
            }).custom(async (value, { req }) => {
                var exp = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[s/./0-9]*$/g
                if(!exp.test(value)){
                    throw new Error(req.__('phone.syntax'));
                }else{
                    return true;
                }
            })
        ];
    },
    async forgetPasswordSms(req, res, next) {
        try {
            convertLang(req)
            let validatedBody = checkValidations(req);
            let realPhone = validatedBody.phone;
            let user = await checkUserExistByPhone(validatedBody.phone);

            user.verifycode = "0000"//generateVerifyCode();
            await user.save();
             //send code
            let message =  ' رمز الدخول الخاص ب manQol هو ' + user.verifycode
            sendSms(realPhone,message)
            let reports = {
                "action":"Send code to phone for forget pass",
                "type":"USERS",
                "deepId":user.id,
                "user": user.id
            };
            await Report.create({...reports });

            res.status(200).send({success: true});
        } catch (error) {
            next(error);
        }
    },
    validateConfirmVerifyCodePhone() {
        return [
            body('phone').not().isEmpty().withMessage((value, { req}) => {
                return req.__('phone.required', { value});
            }).custom(async (value, { req }) => {
                var exp = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[s/./0-9]*$/g
                if(!exp.test(value)){
                    throw new Error(req.__('phone.syntax'));
                }else{
                    return true;
                }
            }),
            body('verifycode').not().isEmpty().withMessage((value, { req}) => {
                return req.__('verifycode.required', { value});
            }),
        ];
    },
    async resetPasswordConfirmVerifyCodePhone(req, res, next) {
        try {
            convertLang(req)
            let validatedBody = checkValidations(req);
            console.log(validatedBody)
            let user = await checkUserExistByPhone(validatedBody.phone);
            if (user.verifycode != validatedBody.verifycode)
                return next(new ApiError.BadRequest(i18n.__('verifyCode.notMatch')));
            user.active = true;
            await user.save();
            let reports = {
                "action":"Confirm code for phone forget pass",
                "type":"USERS",
                "deepId":user.id,
                "user": user.id
            };
            await Report.create({...reports });
            res.status(200).send({success: true});
        } catch (err) {
            next(err);
        }
    },
    validateResetPasswordPhone() {
        return [
            body('verifycode').not().isEmpty().withMessage((value, { req}) => {
                return req.__('verifycode.required', { value});
            }),
            body('phone').not().isEmpty().withMessage((value, { req}) => {
                return req.__('phone.required', { value});
            }),
            body('newPassword').not().isEmpty().withMessage((value, { req}) => {
                return req.__('newPassword.required', { value});
            }).isLength({ min: 8 }).withMessage((value, { req}) => {
                return req.__('newPassword.invalid', { value});
            }).custom(async (value, { req }) => {
                var exp = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
                if(!exp.test(value)){
                    throw new Error(req.__('newPassword.invalid'));
                }
                else
                    return true;
                
            }),
        ];
    },
    async resetPasswordPhone(req, res, next) {
        try {
            convertLang(req)
            let validatedBody = checkValidations(req);
            let user = await checkUserExistByPhone(validatedBody.phone);
            if (user.verifycode != validatedBody.verifycode)
                return next(new ApiError.BadRequest(i18n.__('verifyCode.notMatch')));
            user.password = validatedBody.newPassword;
            await user.save();
            let reports = {
                "action":"rest password by phone",
                "type":"USERS",
                "deepId":user.id,
                "user": user.id
            };
            await Report.create({...reports });
            res.status(200).send({success: true});

        } catch (err) {
            next(err);
        }
    },
    async updateToken(req,res,next){
        try{
            convertLang(req)
            let users = await checkExistThenGet(req.user._id, User);
            let arr2 = users.tokens;
            var found2 = arr2.find(x => x.token == req.body.token)
            if(!found2){
                let theToken = {
                    token: req.body.newToken,
                    osType:req.body.osType?req.body.osType:"IOS"
                }
                users.tokens.push(theToken);
            }
            await users.save();
            res.status(200).send({
                success:true,
                user:await checkExistThenGet(req.user._id, User)
            });
        } catch(err){
            next(err)
        }
    },
    async logout(req,res,next){
        try{
            convertLang(req)
            let user = await checkExistThenGet(req.user._id, User);
            let arr = user.tokens;
            arr = arr.filter(v => v.token != req.body.token)
            user.tokens = arr;
            await user.save();
            res.status(200).send({
                success:true,
                user:await checkExistThenGet(req.user._id, User)
            });
        } catch(err){
            next(err)
        }
    },
    async findById(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let { id } = req.params;
            await checkExist(id, User, { deleted: false });
            let {userId} = req.params;
            let myUser
            if(userId){
                myUser= await checkExistThenGet(userId, User)
            }
            await User.findById(id).populate(populateQuery)
            .then(async(e)=>{
                let index = await transformUserById(e,lang,myUser,userId)
                res.send({success:true,data:index});
            })
        } catch (error) {
            next(error);
        }
    },
    async findAll(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20,
            {search,type} = req.query;
            
            let query = {deleted: false };
            if (type) query.type = type;
            if(search) {
                Object.assign(query ,{
                    $and: [
                        { $or: [
                            {firstname: { $regex: '.*' + search + '.*' , '$options' : 'i'  }}, 
                            {lastname: { $regex: '.*' + search + '.*' , '$options' : 'i'  }}, 
                            {phone: { $regex: '.*' + search + '.*', '$options' : 'i'  }}, 
                          ] 
                        },
                        {deleted: false},
                    ]
                })
            }
            await User.find(query).populate(populateQuery)
            .sort({createdAt: -1})
            .limit(limit)
            .skip((page - 1) * limit)
            .then(async(data)=>{
                let newdata = []
                await Promise.all(data.map(async(e)=>{
                    let index = await transformUser(e,lang)
                    newdata.push(index)
                }))
                
                const usersCount = await User.countDocuments(query);
                const pageCount = Math.ceil(usersCount / limit);
                res.send(new ApiResponse(newdata, page, pageCount, limit, usersCount, req));
            })
           
        } catch (err) {
            next(err);
        }
    },
    async getAll(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth'))); 
            let {search,type} = req.query;
            let query = {deleted: false };
            if (type) query.type = type;
            if(search) {
                Object.assign(query ,{
                    $and: [
                        { $or: [
                            {firstname: { $regex: '.*' + search + '.*' , '$options' : 'i'  }}, 
                            {lastname: { $regex: '.*' + search + '.*' , '$options' : 'i'  }}, 
                            {phone: { $regex: '.*' + search + '.*', '$options' : 'i'  }}, 
                            ] 
                        },
                        {deleted: false},
                    ]
                })
            }
            let sortd = {createdAt: -1}
            
            await User.find(query).populate(populateQuery)
            .sort(sortd)
            .then(async(data)=>{
                let newdata = []
                await Promise.all(data.map(async(e)=>{
                    let index = await transformUser(e,lang)
                    newdata.push(index)
                }))
                res.send({success: true,data:newdata});
            });
        } catch (err) {
            next(err);
        }
    },
    async delete(req, res, next) {
        try {
            convertLang(req)
            let {userId } = req.params;
            let user = await checkExistThenGet(userId, User,{deleted: false });

            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type)){
                if (userId!= req.user._id)
                    return next(new ApiError(403,  i18n.__('notAllow')));
            }
            user.deleted = true
            await user.save();
            let reports = {
                "action":"Delete User",
                "type":"USERS",
                "deepId":user.id,
                "user": req.user._id
            };
            await Report.create({...reports });
            res.status(200).send({success: true});
        }
        catch (err) {
            next(err);
        }
    },
    validateUpdatedUser(isUpdate = true) {
        let validation = [
            body('firstname').trim().optional(),
            body('lastname').trim().optional(),
            body('country').trim().optional().isNumeric().withMessage((value, { req}) => {
                return req.__('country.numeric', { value});
            }).custom(async (value, { req }) => {
                if (!await Country.findOne({_id:value,deleted:false}))
                    throw new Error(req.__('country.invalid'));
                else
                    return true;
            }),
            body('city').trim().optional().isNumeric().withMessage((value, { req}) => {
                return req.__('city.numeric', { value});
            }).custom(async (value, { req }) => {
                if (!await City.findOne({_id:value,deleted:false}))
                    throw new Error(req.__('city.invalid'));
                else
                    return true;
            }),
            body('phone').optional().trim()
            .custom(async (value, { req }) => {
                var exp = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[s/./0-9]*$/g
                if(!exp.test(value)){
                    throw new Error(req.__('phone.syntax'));
                }
                let {userId} = req.params;
                let user = await checkExistThenGet(userId, User);
                let userQuery = { phone: value ,deleted:false};
                if (isUpdate && user.phone === value)
                    userQuery._id = { $ne: userId };

                if (await User.findOne(userQuery))
                    throw new Error(req.__('phone.duplicated'));
                else
                    return true;
            }),
            body('email').trim().optional().isEmail().withMessage('email.syntax')
                .custom(async (value, { req }) => {
                    let {userId} = req.params;
                    let user = await checkExistThenGet(userId, User);
                    let userQuery = { email: { $regex: value , '$options' : 'i'  },deleted:false };
                    if (isUpdate && user.email == value)
                        userQuery._id = { $ne: userId };

                    if (await User.findOne(userQuery))
                        throw new Error(req.__('email.duplicated'));
                    else
                        return true;
            }),
            body('carNumber').trim().optional(),
        ];
        if (isUpdate)
            validation.push([
                body('img').optional().custom(val => isImgUrl(val)).withMessage((value, { req}) => {
                    return req.__('image.invalid', { value});
                })
            ]);

        return validation;
    },
    async updateUser(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            const validatedBody = checkValidations(req);
            let {userId} = req.params;
            let user = await checkExistThenGet(userId, User);
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type)){
                if (userId!= req.user._id)
                    return next(new ApiError(403,  i18n.__('notAllow')));
            }
            if (req.files) {
                if (req.files['img']) {
                    let imagesList = [];
                    for (let imges of req.files['img']) {
                        imagesList.push(await toImgUrl(imges))
                    }
                    validatedBody.img = imagesList[0];
                }
                if (req.files['carLicense']) {
                    let imagesList = [];
                    for (let imges of req.files['carLicense']) {
                        imagesList.push(await toImgUrl(imges))
                    }
                    validatedBody.carLicense = imagesList;
                }
                if (req.files['driverLicense']) {
                    let imagesList = [];
                    for (let imges of req.files['driverLicense']) {
                        imagesList.push(await toImgUrl(imges))
                    }
                    validatedBody.driverLicense = imagesList;
                }
            }
            await User.findByIdAndUpdate(userId, {
                ...validatedBody,
            }, { new: true });
            let reports = {
                "action":"Update User",
                "type":"USERS",
                "deepId":user.id,
                "user": req.user._id
            };
            await Report.create({...reports });
            await User.findById(userId).populate(populateQuery)
            .then(async(e)=>{
                let index = await transformUserById(e,lang)
                res.send({
                    success:true,
                    data:index,
                    token:generateToken(userId)
                });
            })
        } catch (error) {
            next(error);
        }
    },
    validateAddressBody() {
        return [
            body('location').not().isEmpty().withMessage((value, { req}) => {
                return req.__('location.required', { value});
            }).custom(async (value, { req }) => {
                validateDestination(req.body.location);
            }),
            body('city').optional().isNumeric().withMessage((value, { req}) => {
                return req.__('city.numeric', { value});
            }).custom(async (value, { req }) => {
                if (!await City.findOne({_id:value,deleted:false}))
                    throw new Error(req.__('city.invalid'));
                else
                    return true;
            }),
            body('address').not().isEmpty().withMessage((value, { req}) => {
                return req.__('address.required', { value});
            }),
            body('floor').optional().isNumeric().withMessage((value, { req}) => {
                return req.__('floor.invalid', { value});
            }),
            body('elevator').optional().isBoolean().withMessage((value, { req}) => {
                return req.__('elevator.invalid', { value});
            }),
        ];
    },
    async addAddress(req, res, next) {
        try {
            convertLang(req)
            const validatedBody = checkValidations(req);
            validatedBody.owner = req.user._id
            validatedBody.location = { type: 'Point', coordinates: [+req.body.location[0], +req.body.location[1]] };

            let address = await Address.create({ ...validatedBody });
            let reports = {
                "action":"Create address",
                "type":"ADDRESS",
                "deepId":address.id,
                "user": req.user._id
            };
            await Report.create({...reports });
            return res.status(201).send({success: true});
        } catch (error) {
            next(error);
        }
    },
    async findAddresses(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            let page = +req.query.page || 1, limit = +req.query.limit || 20;

            await Address.find({owner:req.user._id,deleted:false}).populate(populateQuery2)
                .sort({createdAt: -1})
                .limit(limit)
                .skip((page - 1) * limit)
                .then(async(data)=>{
                    let newdata = []
                    await Promise.all(data.map(async(e)=>{
                        let index = await transformAddress(e,lang)
                        newdata.push(index)
                    }))
                    const count = await Address.countDocuments({owner:req.user._id,deleted:false});
                    const pageCount = Math.ceil(count / limit);
                    res.send(new ApiResponse(newdata, page, pageCount, limit, count, req));
                })
        } catch (err) {
            next(err);
        }
    },
    async deleteAddress(req, res, next) {
        try {
            convertLang(req)
            let {addressId } = req.params;
            let address = await checkExistThenGet(addressId, Address,{deleted: false });

            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type)){
                if (address.owner != req.user._id)
                    return next(new ApiError(403,  i18n.__('notAllow')));
            }
            address.deleted = true
            await address.save();
            let reports = {
                "action":"Delete address",
                "type":"ADDRESS",
                "deepId":address.id,
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
