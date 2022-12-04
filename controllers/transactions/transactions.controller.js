import ApiResponse from "../../helpers/ApiResponse";
import Report from "../../models/reports/report.model";
import ApiError from '../../helpers/ApiError';
import {checkExistThenGet ,isInArray} from "../../helpers/CheckMethods";
import { convertLang } from "../shared/shared.controller";
import Transaction from "../../models/transaction/transaction.model";
import {transformTransaction} from "../../models/transaction/transformTransaction"
import User from "../../models/user/user.model";
import Booking from "../../models/booking/booking.model";
import i18n from "i18n";
import moment from "moment";
import Setting from "../../models/setting/setting.model";
import {encryptedData,decryptedData} from "../shared/shared.controller"
import config from '../../config'
import { sendEmail } from "../../services/sendGrid";

const populateQuery2 = [
   
    {path: 'booking', model: 'booking'},
    {
        path: 'user', model: 'user',
        populate: { path: 'country', model: 'country' },
    },
    {
        path: 'user', model: 'user',
        populate: { path: 'city', model: 'city' },
    },

];
export default {

    async payment(req,res,next){
        try{
            let data = req.body.Data
            console.log("data",data)
            console.log(await Transaction.findOne({transactionId:data.InvoiceId}))
            if(await Transaction.findOne({transactionId:data.InvoiceId}))
                return next(new ApiError(400, i18n.__('transaction exist')))

            const validatedBody = data.metadata
            
            console.log("meta",validatedBody)
            validatedBody.duration = validatedBody.duration?validatedBody.duration:1;
            let userId = data.metadata.client
            let user = await checkExistThenGet(userId, User, { deleted: false })
            let transactionData={
                "cost":validatedBody.cost,
                "tax":validatedBody.tax?validatedBody.tax:0,
                "totalCost": parseInt(validatedBody.cost) + parseInt(validatedBody.tax?validatedBody.tax:0),
                "user":validatedBody.client,
                "type":validatedBody.type,
                "transactionId":data.InvoiceId,
                "status":data.TransactionStatus,
                "tapObject":JSON.stringify(data)
            }

            if(data.TransactionStatus =="SUCCESS"){
                let booking = await checkExistThenGet(validatedBody.bookingId, booking,{ deleted: false})
                booking.status = "ACCEPTED"
                await booking.save();
            }
            transactionData.booking = validatedBody.bookingId;
            let createdTransaction = await Transaction.create({... transactionData})
            let transactionId = createdTransaction.id;
            let encryptedId = await encryptedData(transactionId.toString(),config.Securitykey)
            //console.log(req.originalUrl)
            let url = req.protocol + '://manQol.com/tax-invoice/'+encryptedId;
            let text = 'رابط الفاتوره الضريبيه الخاصه بك هو : '
            //sendEmail(user.email,url, text)
            let theTransaction = await checkExistThenGet(createdTransaction._id,Transaction)
            theTransaction.billUrl = url;
            await theTransaction.save();
            console.log(url)
            let report = {
                "action":"payment"
            }
            await Report.create({...report,user:validatedBody.client})
            res.send({
                success: true,
            });
        }catch(error){
            next(error)
        }
    },
    async findAllTransactions(req, res, next) {
        try {
            convertLang(req)
            //get lang
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let lang = i18n.getLocale(req)
            let page = req.query.page || 1, limit = +req.query.limit || 20 ;
            let {user,booking,status} = req.query;
            
            let query = {deleted: false };
            if (booking) query.booking = booking;
            if (status) query.status = status;
            if (user) query.user = user;
            let sortd = {_id: -1}
            await Transaction.find(query).populate(populateQuery2)
            .sort(sortd)
            .limit(limit)
            .skip((page - 1) * limit)
            .then(async(data)=>{
                let newdata = []
                await Promise.all(data.map(async(e)=>{
                    let index = await transformTransaction(e,lang)
                    newdata.push(index)
                    
                }))
                const count = await Transaction.countDocuments(query);
                const pageCount = Math.ceil(count / limit);
                res.send(new ApiResponse(newdata, page, pageCount, limit, count, req));
            })
            
        } catch (err) {
            next(err);
        }
    },
    async getAllTransactions(req, res, next) {
        try {
            convertLang(req)
            //get lang
            if(!isInArray(["ADMIN","SUB-ADMIN"],req.user.type))
                return next(new ApiError(403, i18n.__('admin.auth')));
            let lang = i18n.getLocale(req)
            let {user,booking,status} = req.query;
            
            let query = {deleted: false };
            if (booking) query.booking = booking;
            if (status) query.status = status;
            if (user) query.user = user;
            let sortd = {createdAt: -1}
            await Transaction.find(query).populate(populateQuery2)
            .sort(sortd)

            .then(async(data)=>{
                let newdata = []
                await Promise.all(data.map(async(e)=>{
                    let index = await transformTransaction(e,lang)
                    newdata.push(index)
                    
                }))
                
                res.send({success:true,data:newdata});
            })
            
        } catch (err) {
            next(err);
        }
    },
    async getById(req, res, next) {
        try {
            convertLang(req)
            let lang = i18n.getLocale(req)
            
            let {transactionId} = req.params
            const Securitykey =  config.Securitykey
            console.log(transactionId.toString())
            let decreptId = await decryptedData(transactionId.toString(),Securitykey)
            console.log(decreptId)
            await Transaction.findById(decreptId).populate(populateQuery2)
            .then(async(e)=>{
                let index = await transformTransaction(e,lang)
                res.send({success:true,data:index});
            })
            
        } catch (err) {
            next(err);
        }
    },
};