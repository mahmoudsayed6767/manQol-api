import mongoose, { Schema } from "mongoose";
import autoIncrement from 'mongoose-auto-increment';
const RateSchema=new Schema({
    _id: {
        type: Number,
        required: true
    },
    user:{
        type: Number,
        ref: 'user'
    },
    driver:{
        type: Number,
        ref: 'user'
    },
    order:{
        type: Number,
        ref: 'order'
    },
    comment:{
        type:String,
        //required:true
    },
    rate:{
        type:String,
        required:true
    },
    dateMillSec:{
        type:Number,
        required: true,
        default:Date.now
    },
    haveComment:{
        type:Boolean,
        default:true,
    },

    deleted:{
        type:Boolean,
        default:false
    },

},{ timestamps: true });
RateSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
RateSchema.plugin(autoIncrement.plugin, { model: 'rate', startAt: 1 });

export default mongoose.model('rate', RateSchema);