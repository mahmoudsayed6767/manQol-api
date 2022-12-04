
import mongoose, { Schema } from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';

const transactionSchema = new Schema({

    _id: {
        type: Number,
        required: true
    },
    transactionId: {
        type:String,
        required:true
    },
    user:{
        type:Number,
        ref:'user',
        required:true
    },
    booking:{
        type:Number,
        ref:'booking',
    },
    status:{
        type:String,
        required:true,
        enum:["FAILED", "SUCCESS"]
    },
    dateMillSec:{
        type:Number,
        required:true,
        default:Date.now
    },
    tax:{
        type:Number,
        required:true,
        default:0
    },
    cost:{
        type:Number,
        required:true,
        default:0
    },
    totalCost:{
        type:Number,
        required:true,
        default:0
    },
    payObject:{
        type:String,
    },
    billUrl:{
        type:String,
    },
    deleted:{
        type:Boolean,
        default:false
    },
});

transactionSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.deleted;
    }
});



transactionSchema.plugin(autoIncrement.plugin, { model: 'transaction', startAt: 1 });

export default mongoose.model('transaction', transactionSchema);
