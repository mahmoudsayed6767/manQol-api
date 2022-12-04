import { checkExistThenGet, checkExist } from '../../helpers/CheckMethods';
import { body } from 'express-validator/check';
import { checkValidations } from '../shared/shared.controller';
import User from "../../models/user/user.model";
import Report from "../../models/reports/report.model";
import ApiError from '../../helpers/ApiError';
import ApiResponse from "../../helpers/ApiResponse";
const populateQuery = [
    { path: 'user', model: 'user' },

];
export default {

    async findAll(req, res, next) {
        try {
            let page = +req.query.page || 1, limit = +req.query.limit || 20
            ,{user,type} = req.query
            , query = {deleted: false };
        
            if (user) query.user = user;
            if (type) query.type = type;
            let reports = await Report.find(query).populate(populateQuery)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit);

            const reportsCount = await Report.countDocuments(query);
            const pageCount = Math.ceil(reportsCount / limit);

            res.send(new ApiResponse(reports, page, pageCount, limit, reportsCount, req));
        } catch (err) {
            next(err);
        }
    },
    async findById(req, res, next) {
        try {
            let { reportId } = req.params;
            await checkExist(reportId, Report, { deleted: false });
            let report = await Report.findById(reportId).populate({
                path: 'user', 
            });
            res.send({success:true,data:report});
        } catch (err) {
            next(err);
        }
    },
    async delete(req, res, next) {
        try {
            if (req.user.type != 'ADMIN')
                return next(new ApiError(403, ('admin.auth')));
                
            let { reportId } = req.params;

            let report = await checkExistThenGet(reportId, Report, { deleted: false });
            report.deleted = true;

            await report.save();
            res.status(200).send({success:true});

        }
        catch (err) {
            next(err);
        }
    }

}