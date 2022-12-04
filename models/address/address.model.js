import mongoose, { Schema } from "mongoose";
import { isImgUrl } from "../../helpers/CheckMethods";
import autoIncrement from 'mongoose-auto-increment';
const addressSchema=new Schema({
    _id: {
        type: Number,
        required: true
    },
    owner: {
        type: Number,
        ref:'user',
        required: true
    },
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
        //required: true
    },
    elevator: {
        type: Boolean,
        //required: true
    },
    deleted:{
        type:Boolean,
        default:false
    },

},{ timestamps: true });
addressSchema.index({ location: '2dsphere' });

addressSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
autoIncrement.initialize(mongoose.connection);
addressSchema.plugin(autoIncrement.plugin, { model: 'address', startAt: 1 });

export default mongoose.model('address', addressSchema);