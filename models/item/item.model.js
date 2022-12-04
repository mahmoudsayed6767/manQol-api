import mongoose, { Schema } from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';


const itemSchema = new Schema({

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
    availableServices:{
        type: [Number],
        ref:'service',
        required: true,
    },
    deleted:{
        type:Boolean,
        default:false
    }
}, { timestamps: true });

itemSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.deleted;
    }
});


itemSchema.plugin(autoIncrement.plugin, { model: 'item', startAt: 1 });

export default mongoose.model('item', itemSchema);
