import mongoose, { Schema } from "mongoose";
import autoIncrement from 'mongoose-auto-increment';
const offerSchema=new Schema({
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
        required:true
    },
    order:{
        type:Number,
        ref:'order',
        required:true
    },
    status:{
        type:String,
        enum:['PENDING','ACCEPTED','REJECTED'],
        default:'PENDING',
        required:true,
    },
    location: {
        type: { type: String, enum: 'Point' },
        coordinates: { type: [Number] }
    },
    price:{
        type:Number,
        required: true,
    },
    deleted:{
        type:Boolean,
        default:false
    },

},{ timestamps: true });
offerSchema.index({ location: '2dsphere' });

offerSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        if (ret.location) {
            ret.location = ret.location.coordinates;
        }
    }
});
autoIncrement.initialize(mongoose.connection);
offerSchema.plugin(autoIncrement.plugin, { model: 'offer', startAt: 1 });

export default mongoose.model('offer', offerSchema);