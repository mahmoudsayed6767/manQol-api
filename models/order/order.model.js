import mongoose, { Schema } from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const orderSchema=new Schema({
    _id: {
        type: Number,
        required: true
    },
    client:{
        type:Number,
        ref:'user',
        required:true
    },
    driver:{
        type:Number,
        ref:'user',
    },
    status:{
        type:String,
        enum:['PENDING','ACCEPTED','SHIPPING','CANCELED','DELIVERED'],
        default:'PENDING',
        required:true,
    },
    date:{
        type:Date,
        required: true,
    },
    dateMillSec:{
        type: Number,
        required: true,
    },
    items: [
        new Schema({
            item: {
                type: Number,
                ref: 'item',
                required: true
            },
            services: {
                type: [Number],
                ref: 'service',
                required: true,
            },
            count: {
                type: Number,
                default: 1
            },

        }, { _id: false })
    ],
    fromAddress: {
        location: {
            type: { type: String, enum: 'Point' },
            coordinates: { type: [Number] },
        },
        city: {
            type: Number,
            ref:'city',
            required: true
        },
        address: {
            type: String,
            required: true
        },
        floor: {
            type: Number,
            required: true
        },
        elevator: {
            type: Boolean,
            required: true
        }
    },
    toAddress: {
        location: {
            type: { type: String, enum: 'Point' },
            coordinates: { type: [Number] },
        },
        city: {
            type: Number,
            ref:'city',
            required: true
        },
        address: {
            type: String,
            required: true
        },
        floor: {
            type: Number,
            required: true
        },
        elevator: {
            type: Boolean,
            required: true
        },
    },
    shippingDateMillSec:{
        type:Number,
    },
    deliveredDateMillSec:{
        type:Number,
    },
    images: {
        type: [String],
    },
    video: {
        type: String,
    },
    deleted:{
        type:Boolean,
        default:false
    },

},{ timestamps: true });
orderSchema.index({ location: '2dsphere' });

orderSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
orderSchema.plugin(autoIncrement.plugin, { model: 'order', startAt: 1 });

export default mongoose.model('order', orderSchema);