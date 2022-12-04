import mongoose, { Schema } from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';
import bcrypt from 'bcryptjs';
import isEmail from 'validator/lib/isEmail';
import { isImgUrl } from "../../helpers/CheckMethods";

const userSchema = new Schema({
    _id: {
        type: Number,
        required: true
    },
    firstname: {
        type: String,
        required: true,
        trim: true
    },
    lastname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,  
        validate: {
            validator: (email) => isEmail(email),
            message: 'Invalid Email Syntax'
        }     
    },
    phone: {
        type:String,
        required: true,
        trim:true
    },
    password: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['DRIVER','SUBERVISOR','ADMIN','USER'],
        required:true
    },
    country: {
        type: Number,
        ref:'country',
    },
    city: {
        type: Number,
        ref:'city',
    },
    block:{
        type: Boolean,
        default: false
    },
    active:{
        type: Boolean,
        default: false
    },
    img: {
        type: String,
        default:"https://res.cloudinary.com/boody-car/image/upload/v1586870969/c8jzyavvoexpu25wayfr.png",
    },
    verifycode: {
        type: Number
    },
    tokens: [
        new Schema({
            token: {
                type: String,
            },
            osType: {
                type: String,
                enum:['IOS','ANDROID','WEB'],
                default: 'IOS'
            }
            
        }, { _id: false })
        
    ],
    rate: {
        type: Number,
        default:0
    },
    rateNumbers: {
        type: Number,
        default:0
    },
    rateCount: {
        type: Number,
        default:0
    },
    carNumber:{
        type: String,
    },
    carLicense:{
        type: [String],
    },
    driverLicense:{
        type: [String],
    },
    online: {
        type: Boolean,
        default: false
    },
    verify: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    },
}, { timestamps: true, discriminatorKey: 'kind' });

userSchema.pre('save', function (next) {
    const account = this;
    if (!account.isModified('password')) return next();

    const salt = bcrypt.genSaltSync();
    bcrypt.hash(account.password, salt).then(hash => {
        account.password = hash;
        next();
    }).catch(err => console.log(err));
});

userSchema.methods.isValidPassword = function (newPassword, callback) {
    let user = this;
    bcrypt.compare(newPassword, user.password, function (err, isMatch) {
        if (err)
            return callback(err);
        callback(null, isMatch);
    });
};

userSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret.password;
        delete ret._id;
        delete ret.__v;
        delete ret.deleted;
        delete ret.verifycode;
    }
});
autoIncrement.initialize(mongoose.connection);
userSchema.plugin(autoIncrement.plugin, { model: 'user', startAt: 1 });
export default mongoose.model('user', userSchema);