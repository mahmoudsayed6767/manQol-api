import ApiError from "../../helpers/ApiError";
import User from "../../models/user/user.model";
import Booking from "../../models/booking/booking.model";
import Anoncement from "../../models/anoncement/anoncement.model";
import {transformUser} from "../../models/user/transformUser";
import {transformBooking} from "../../models/booking/transformBooking";
import {isInArray } from "../../helpers/CheckMethods";
import moment from 'moment';
import i18n from 'i18n'
const populateQuery = [
    { path: 'city', model: 'city' },
    { path: 'country', model: 'country' } 
];
const populateQuery2 = [ 
    { path: 'guide', model: 'user',},
    { path: 'client', model: 'user',},
];
export default {
    async getLastUser(req, res, next) {
        try {
            let query = {
              deleted: false
            };
            let lastUser = await User.find(query).populate(populateQuery)
                .sort({ createdAt: -1 })
                .limit(10).then(async(data) => {
                    let newdata = []
                    await Promise.all(data.map(async(e)=>{
                        console.log(e._id)
                        let index = await transformUser(e);
                        newdata.push(index)
                    }))
                    res.send({success: true,users:newdata});
                })

            res.send(lastUser);
        } catch (error) {
            next(error);
        }
    },

    async getLastBookings(req, res, next) {
        try {
            let user = req.user;
            if (user.type != 'ADMIN')
                return next(new ApiError(403, 'bad auth'));
            let { status} = req.query
            let query = {deleted: false };
            if (status)
                query.status = status;                
            await Booking.find(query).populate(populateQuery2)
                .sort({ createdAt: -1 })
                .limit(10).then(async(data) => {
                    let newdata = []
                    data.map(async(e)=>{
                        console.log(e._id)
                        let index = await transformBooking(e);
                        newdata.push(index)
                    })
                    res.send({success: true,Bookings:newdata});
                })
        } catch (error) {
            next(error);
        }
    },
   
    async count(req,res, next) {
        try {
            let query = { deleted: false };
            const usersCount = await User.countDocuments({deleted: false,type:'USER'});
            const guidesCount = await User.countDocuments({deleted: false,type:'GUIDE'});
            const totalBookings = await Booking.countDocuments({deleted: false});
            const endedBookings = await Booking.countDocuments({deleted: false,status:'ENDED'});
            const pendingBookings = await Booking.countDocuments({deleted: false,status:'PENDING'});
            const anoncementsCount = await Anoncement.countDocuments({deleted: false});
            res.status(200).send({
                users:usersCount,
                guidesCount:guidesCount,
                pendingBookings:pendingBookings,
                endedBookings:endedBookings,
                totalBookings:totalBookings,
                anoncementsCount:anoncementsCount,
                
            });
        } catch (err) {
            next(err);
        }
        
    },
    
}