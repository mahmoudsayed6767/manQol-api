import mongoose, { Schema } from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';
import { isImgUrl } from "../../helpers/CheckMethods";

const countrySchema = new Schema({

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
        trim: true,
    },
    img:{
        type: String,
        validate: {
            validator: imgUrl => isImgUrl(imgUrl),
            message: 'img is invalid url'
        },
        required:true
    }, 
    countryCode:{
        type: String,
        required:true,
        trim: true,
    },
    numbersCount:{
        type: Number,
        required:true,
    },
    isoCode:{
        type: String,
        required:true,
    },
    hint:{
        type: String,
        default:""
    },
    deleted:{
        type:Boolean,
        default:false
    }
});

countrySchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.deleted;
    }
});



countrySchema.plugin(autoIncrement.plugin, { model: 'country', startAt: 1 });

export default mongoose.model('country', countrySchema);
