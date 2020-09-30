var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var Schema = mongoose.Schema;
var userSettingSchema = new Schema({
    _id: 
        {
            type: String,
            required: true
        },
    userType: 
        {
            type: String,
            enum: ['normal', 'gold'],
            default: 'normal',
            required: false
        },        
    discount: 
        { 
        type: Number,
        required: false
        },
    clover: 
        { 
        type: Number,
        required: false
        } 
}, {
    timestamps: true
});

userSettingSchema.plugin(mongoosePaginate);
userSettingSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('UserSetting', userSettingSchema);