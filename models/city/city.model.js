import mongoose, { Schema } from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';


const citySchema = new Schema({

    _id: {
        type: Number,
        required: true
    },
    name_en: {
        type: String,
        required: true,
        trim: true,
    },
    name_ar: {
        type: String,
        trim: true,
        required: true,
    },
    country: {
        type: Number,
        ref: 'country',
        required: true,
    },
    deleted:{
        type:Boolean,
        default:false
    }
});
citySchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.deleted;
    }
});


citySchema.plugin(autoIncrement.plugin, { model: 'city', startAt: 1 });

export default mongoose.model('city', citySchema);
