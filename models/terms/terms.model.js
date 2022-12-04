import mongoose, { Schema } from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';


const termsSchema = new Schema({

    _id: {
        type: Number,
        required: true
    },
    terms_en: {
        type: String,
        required: true,
        trim: true,
    },
    terms_ar: {
        type: String,
        required: true,
        trim: true
    },
    privacy_ar: {
        type: String,
        required: true,
        trim: true
    },
    privacy_en: {
        type: String,
        trim: true,
        default:""
    },
    deleted:{
        type:Boolean,
        default:false
    }
}, { timestamps: true });

termsSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.deleted;
    }
});


termsSchema.plugin(autoIncrement.plugin, { model: 'terms', startAt: 1 });

export default mongoose.model('terms', termsSchema);
