var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var CloversEarnSchema = new Schema({

    _id: {
        type: String,
        require: true
    },
    name: {
        type: String,
        require: true
    },
    sub_title: {
        type: String,
        default: ''
    },
    clovers_point: {
        type: Number,
        require: true
    },
    type: {
        type: String,
        enum: ['new_restaurant', 'valid_teammate', 'food_ride', 'help_us_improve', 'birthday_bonus', 'favorite_restaurant', 'reffer_bonus', 'order_bonus', 'app_rating_bonus'],
        default: 'new_restaurant'
    },
    applicable: {
        type: String,
        enum: ['one-time', 'one-in-month', 'no-limit'],
        default: 'no-limit'
    },
    status: {
        type: String,
        enum: ['Publish', 'Hidden'],
        default: 'Publish'
    }
}, {
    timestamps: true
});

CloversEarnSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Clover-earning-schema', CloversEarnSchema);