var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var userschema = new Schema({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        default: ''
    },
    profile_image: {
        type: String,
        default: ''
    },
    profile_image_updated: {
        type: String,
        enum: [true, false],
        default: false
    },
    email: {
        type: String,
        default: ''
    },
    newemail: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        default: ''
    },
    phone_no: {
        type: String,
        default: ''
    },
    country_code: {
        type: String,
        default: ''
    },
    newphone_no: {
        type: String,
        default: ''
    },
    newcountry_code: {
        type: String,
        default: ''
    },
    dob: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['FB', 'GOOGLE', 'NORMAL'],
        default: 'NORMAL'
    },
    socialLogin: [{
        type: {
            type: String,
            enum: ['FB', 'GOOGLE'],
            default: ''
        },
        socialId: {
            type: String,
            default: ''
        },
        image: {
            type: String,
            default: ''
        }
    }],
    devicetoken: {
        type: String,
        default: ''
    },
    verification_method: {
        type: String,
        enum: ['EMAIL', 'SMS'],
        default: 'EMAIL'
    },
    verification_code: {
        type: String,
        default: ''
    },
    otp: {
        type: String,
        default: ''
    },
    apptype: {
        type: String,
        enum: ['IOS', 'ANDROID', 'BROWSER'],
        default: ''
    },
    status: {
        type: String,
        enum: ['yes', 'no'],
        default: 'yes'
    },
    email_verify: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    },
    rewardPoint: {
        type: Number,
        default: 0
    },
    redeemReward: {
        type: Number,
        default: 0
    },
    referralCode: {
        type: String,
        default: ''
    },
    gold_member: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    },
    creditId: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});
userschema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password'))
        return next();

    bcrypt.hash(user.password, null, null, function (err, hash) {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    });
});
userschema.plugin(mongoosePaginate);
userschema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('User', userschema);