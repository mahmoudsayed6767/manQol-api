import mongoose, { Schema } from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';


const serviceSchema = new Schema({

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
        required: true,
        trim: true
    },
    deleted:{
        type:Boolean,
        default:false
    }
}, { timestamps: true });

serviceSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.deleted;
    }
});


serviceSchema.plugin(autoIncrement.plugin, { model: 'service', startAt: 1 });

export default mongoose.model('service', serviceSchema);
