var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
var cretidSystemSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    order_type: {
        type: String,
        enum: ['SOLO', 'TEAM'],
        default: 'SOLO',
        required: true
    },
    type: {
        type: String,
        enum: [
            'single_time',
            'multiple_time',
            'unlimited_time'
        ],
        default: 'single_time',
        required: true
    },
    allowed_times: {
        type: Number,
        default: 0
    },
    discount_amount: {
        type: Number,
        required: true
    },
    min_amount: {
        type: Number,
        required: true
    },
    days: [{
        type: Number,
        default: ''
    }],
    dead_line: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    },
    date: {
        openingTime: {
            type: String,
            default: ''
        },
        closingTime: {
            type: String,
            default: ''
        }
    },
    reason: {
        type: String,
        default: ''
    },
    enable: {
        type: String,
        enum: ['yes', 'no'],
        default: 'yes'
    }

}, {
    timestamps: true
});
cretidSystemSchema.plugin(mongoosePaginate);
cretidSystemSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Credit-System', cretidSystemSchema);